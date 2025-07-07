// app/api/kkiapay-callback/route.js
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';  // Chemin corrigé (3 ../ au lieu de 4)
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const KKIA_PRIVATE_API_KEY = process.env.KKIA_PRIVATE_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transactionId');
  const statusFromKkiapay = searchParams.get('status');
  const reference = searchParams.get('reference');

  console.log("Kkiapay Callback (GET) reçu:", { transactionId, statusFromKkiapay, reference });

  if (!transactionId) {
    console.error("Callback Kkiapay: transactionId manquant.");
    return NextResponse.redirect(
      `${request.nextUrl.origin}/order-status?status=error&message=${encodeURIComponent('ID de transaction Kkiapay manquant dans le callback.')}`
    );
  }

  if (!KKIA_PRIVATE_API_KEY) {
    console.error("KKIA_PRIVATE_API_KEY n'est pas configuré. Impossible de vérifier la transaction Kkiapay.");
    return NextResponse.redirect(
      `${request.nextUrl.origin}/order-status?status=error&message=${encodeURIComponent('Configuration serveur incomplète pour le paiement.')}`
    );
  }

  let connection;
  try {
    connection = await pool.getConnection();

    let kkiapayVerificationStatus = 'FAILED';
    let kkiapayTransactionAmount = 0;
    let kkiapayPaymentMethod = 'Inconnu';
    let kkiapayErrorMessage = '';
    let kkiapayCustomerEmail = '';
    let kkiapayCustomerPhone = '';

    // Étape 1: Vérifier la transaction Kkiapay via leur API de vérification
    try {
      const verificationResponse = await axios.post(
        'https://api.kkiapay.me/v1/transactions/status',
        { transactionId },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': KKIA_PRIVATE_API_KEY,
          },
        }
      );

      console.log("Réponse de vérification Kkiapay:", verificationResponse.data);

      if (verificationResponse.data && verificationResponse.data.status === 'SUCCESS') {
        kkiapayVerificationStatus = 'COMPLETED';
        kkiapayTransactionAmount = verificationResponse.data.amount;
        kkiapayPaymentMethod = verificationResponse.data.paymentMethod || 'Mobile Money';
        kkiapayCustomerEmail = verificationResponse.data.email || '';
        kkiapayCustomerPhone = verificationResponse.data.phone || '';

        let orderPayloadFromKkiapay = null;
        if (verificationResponse.data.data) {
          try {
            orderPayloadFromKkiapay = JSON.parse(verificationResponse.data.data);
            console.log("Payload de commande récupéré de Kkiapay:", orderPayloadFromKkiapay);
          } catch (parseError) {
            console.error("Erreur de parsing du champ 'data' de Kkiapay:", parseError);
          }
        }

        if (
          !orderPayloadFromKkiapay ||
          !orderPayloadFromKkiapay.userId ||
          !orderPayloadFromKkiapay.items ||
          !orderPayloadFromKkiapay.shippingAddress
        ) {
          console.error("Données de commande complètes manquantes dans le payload Kkiapay 'data'. Impossible de créer la commande.");
          return NextResponse.redirect(
            `${request.nextUrl.origin}/order-status?status=error&message=${encodeURIComponent('Données de commande manquantes après vérification Kkiapay.')}`
          );
        }

        // Démarrer la transaction DB seulement si la vérification Kkiapay est un succès
        await connection.beginTransaction();

        const orderId = transactionId;
        const userId = orderPayloadFromKkiapay.userId;
        const totalAmount = orderPayloadFromKkiapay.totalAmount;
        const shippingAddress = orderPayloadFromKkiapay.shippingAddress;
        const items = orderPayloadFromKkiapay.items;
        const currency = orderPayloadFromKkiapay.currency;

        // 2. Insérer la commande dans la table `orders`
        await connection.execute(
          `INSERT INTO \`orders\` (
            \`id\`, \`userId\`, \`totalAmount\`, \`status\`, \`paymentStatus\`,
            \`shippingAddressLine1\`, \`shippingAddressLine2\`, \`shippingCity\`,
            \`shippingState\`, \`shippingZipCode\`, \`shippingCountry\`, \`orderDate\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            orderId,
            userId,
            totalAmount,
            'PAID_SUCCESS',
            'COMPLETED',
            shippingAddress.fullName || '',
            shippingAddress.area || '',
            shippingAddress.city || '',
            shippingAddress.state || '',
            shippingAddress.pincode || '',
            shippingAddress.country || 'Bénin',
          ]
        );
        console.log(`Commande ${orderId} insérée avec statut PAID_SUCCESS pour userId ${userId}`);

        // 3. Insérer les articles de la commande dans `order_items`
        for (const item of items) {
          await connection.execute(
            `INSERT INTO \`order_items\` (
              \`id\`, \`orderId\`, \`productId\`, \`quantity\`, \`priceAtOrder\`, \`createdAt\`
            ) VALUES (?, ?, ?, ?, ?, NOW())`,
            [uuidv4(), orderId, item.productId, item.quantity, item.price]
          );
        }
        console.log(`Articles insérés pour la commande ${orderId}`);

        // 4. Insérer l'enregistrement de paiement final dans `payments`
        const paymentId = uuidv4();
        await connection.execute(
          `INSERT INTO \`payments\` (
            \`id\`, \`orderId\`, \`paymentMethod\`, \`transactionId\`, \`amount\`,
            \`currency\`, \`status\`, \`paymentDate\`, \`createdAt\`
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            paymentId,
            orderId,
            kkiapayPaymentMethod,
            reference || transactionId,
            kkiapayTransactionAmount,
            currency,
            'COMPLETED',
          ]
        );
        console.log(`Paiement ${paymentId} inséré avec statut COMPLETED pour la commande ${orderId}`);

        // 5. Vider le panier de l'utilisateur après un paiement réussi
        await connection.execute(`DELETE FROM \`cart_items\` WHERE \`userId\` = ?`, [userId]);
        console.log(`Panier de l'utilisateur ${userId} vidé après paiement réussi.`);

        await connection.commit();

        return NextResponse.redirect(`${request.nextUrl.origin}/order-status?orderId=${orderId}&status=success`);
      } else {
        kkiapayErrorMessage = verificationResponse.data.message || 'Échec de la vérification Kkiapay.';
        console.warn(`Vérification Kkiapay échouée pour transaction ${transactionId}: ${kkiapayErrorMessage}`);
        return NextResponse.redirect(
          `${request.nextUrl.origin}/order-status?orderId=${transactionId}&status=failed&message=${encodeURIComponent(kkiapayErrorMessage)}`
        );
      }
    } catch (kkiapayError) {
      console.error("Erreur lors de l'appel à l'API de vérification Kkiapay (bloc catch):", kkiapayError.response?.data || kkiapayError.message);
      kkiapayErrorMessage = `Erreur de communication Kkiapay: ${kkiapayError.response?.data?.message || kkiapayError.message}`;
      return NextResponse.redirect(
        `${request.nextUrl.origin}/order-status?orderId=${transactionId}&status=failed&message=${encodeURIComponent(kkiapayErrorMessage)}`
      );
    }
  } catch (error) {
    if (connection) {
      await connection.rollback();
      console.error("Transaction annulée dans kkiapay-callback en raison d'une erreur interne:", error);
    }
    console.error("Erreur serveur interne dans kkiapay-callback:", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/order-status?status=error&message=${encodeURIComponent('Erreur interne du serveur lors du traitement du paiement.')}`
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request) {
  console.log("Kkiapay Callback (POST) reçu. Traitement similaire à GET.");
  return GET(request);
}
