// app/api/kkiapay-callback/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Assure-toi que le chemin est correct.
import axios from 'axios';
// La bibliothèque 'uuid' n'est plus nécessaire pour les IDs gérés par Prisma

const KKIA_PRIVATE_API_KEY = process.env.KKIA_PRIVATE_API_KEY;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transactionId');
  const statusFromKkiapay = searchParams.get('status'); // Peut être utile pour le log, mais la vérification API est primaire
  const reference = searchParams.get('reference'); // Souvent l'orderId que tu as passé à Kkiapay

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

  let kkiapayErrorMessage = '';

  try {
    let kkiapayVerificationStatus = 'FAILED'; // Par défaut
    let kkiapayTransactionAmount = 0;
    let kkiapayPaymentMethod = 'Inconnu';
    let kkiapayCustomerEmail = '';
    let kkiapayCustomerPhone = '';
    let orderPayloadFromKkiapay = null;

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
          !orderPayloadFromKkiapay.shippingAddress ||
          orderPayloadFromKkiapay.totalAmount === undefined || // Assurez-vous que totalAmount est bien là
          orderPayloadFromKkiapay.currency === undefined // Assurez-vous que currency est bien là
        ) {
          console.error("Données de commande complètes manquantes dans le payload Kkiapay 'data'. Impossible de créer la commande.");
          return NextResponse.redirect(
            `${request.nextUrl.origin}/order-status?status=error&message=${encodeURIComponent('Données de commande manquantes après vérification Kkiapay.')}`
          );
        }

        // --- Démarrer la transaction DB avec Prisma ---
        // Toutes les opérations DB sont enveloppées dans une transaction atomique
        await prisma.$transaction(async (tx) => {
          const orderId = reference || transactionId; // Utilise la référence si disponible, sinon l'ID de transaction
          const userId = orderPayloadFromKkiapay.userId;
          const totalAmount = orderPayloadFromKkiapay.totalAmount;
          const shippingAddress = orderPayloadFromKkiapay.shippingAddress;
          const items = orderPayloadFromKkiapay.items;
          const currency = orderPayloadFromKkiapay.currency;

          // 2. Insérer la commande dans la table `orders`
          // Utilise upsert pour éviter les doublons si le webhook est appelé plusieurs fois
          const orderData = {
            userId: userId,
            totalAmount: totalAmount,
            status: 'PAID_SUCCESS',
            paymentStatus: 'COMPLETED',
            shippingAddressLine1: shippingAddress.fullName || '',
            shippingAddressLine2: shippingAddress.area || '', // Assurez-vous que c'est bien area pour Line2
            shippingCity: shippingAddress.city || '',
            shippingState: shippingAddress.state || '',
            shippingZipCode: shippingAddress.pincode || '',
            shippingCountry: shippingAddress.country || 'Bénin',
            // orderDate est géré par @default(now()) dans le schéma
          };

          await tx.order.upsert({
            where: { id: orderId },
            update: orderData, // Met à jour si la commande existe déjà (par ex. si elle était PENDING)
            create: {
              id: orderId, // Utilise l'ID de transaction/référence comme ID de commande
              ...orderData,
            },
          });
          console.log(`Commande ${orderId} insérée/mise à jour avec statut PAID_SUCCESS pour userId ${userId}`);

          // 3. Insérer les articles de la commande dans `order_items`
          // D'abord, supprimer les anciens articles de commande pour éviter les doublons si le webhook est ré-appelé
          await tx.orderItem.deleteMany({
            where: { orderId: orderId },
          });

          const orderItemsData = items.map(item => ({
            orderId: orderId,
            productId: item.productId,
            quantity: item.quantity,
            priceAtOrder: item.price,
            name: item.name, // Assurez-vous que 'name' est passé dans le payload
            imgUrl: item.imgUrl, // Assurez-vous que 'imgUrl' est passé dans le payload
            // createdAt est géré par @default(now()) dans le schéma
          }));
          await tx.orderItem.createMany({
            data: orderItemsData,
            skipDuplicates: true, // Pour éviter des erreurs si un ID d'item est déjà là (moins probable avec UUID)
          });
          console.log(`Articles insérés pour la commande ${orderId}`);

          // 4. Insérer/Mettre à jour l'enregistrement de paiement final dans `payments`
          await tx.payment.upsert({
            where: { orderId: orderId }, // orderId est unique dans le modèle Payment
            update: {
              paymentMethod: kkiapayPaymentMethod,
              transactionId: transactionId, // L'ID de transaction Kkiapay
              amount: kkiapayTransactionAmount,
              currency: currency,
              status: 'COMPLETED',
              paymentDate: new Date(),
            },
            create: {
              orderId: orderId,
              paymentMethod: kkiapayPaymentMethod,
              transactionId: transactionId,
              amount: kkiapayTransactionAmount,
              currency: currency,
              status: 'COMPLETED',
              paymentDate: new Date(),
            },
          });
          console.log(`Paiement inséré/mis à jour avec statut COMPLETED pour la commande ${orderId}`);

          // 5. Vider le panier de l'utilisateur après un paiement réussi
          await tx.cartItem.deleteMany({
            where: { userId: userId },
          });
          console.log(`Panier de l'utilisateur ${userId} vidé après paiement réussi.`);
        }); // Fin de la transaction Prisma

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
    // Les erreurs de la transaction Prisma seront capturées ici
    console.error("Erreur serveur interne dans kkiapay-callback (hors Kkiapay API):", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/order-status?status=error&message=${encodeURIComponent('Erreur interne du serveur lors du traitement du paiement.')}`
    );
  }
}

export async function POST(request) {
  console.log("Kkiapay Callback (POST) reçu. Traitement similaire à GET.");
  // Redirige la requête POST vers la fonction GET pour le traitement.
  // C'est une approche si Kkiapay envoie des webhooks via GET et POST,
  // mais il est plus courant que les webhooks soient POST.
  // Assurez-vous que Kkiapay envoie des paramètres de requête dans le corps du POST
  // si tu veux que GET(request) fonctionne avec req.json().
  // Si Kkiapay envoie des paramètres dans le corps du POST, tu devras adapter la fonction GET
  // pour lire req.json() au lieu de searchParams.
  return GET(request); // Attention: Si Kkiapay envoie des données POST dans le body, GET ne les lira pas.
                       // Il serait préférable de dupliquer la logique ou de créer une fonction utilitaire.
}