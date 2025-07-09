// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\orders\confirm\route.js

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assure-toi que le chemin est correct et que c'est bien 'prisma'
import { verifyPaymentToken } from '@/lib/payment'; // à créer (fonction qui valide le token auprès du fournisseur)

/**
 * Gère la requête POST pour confirmer une commande après un paiement.
 * @param {Request} request - L'objet Request de Next.js.
 * @returns {Promise<NextResponse>}
 */
export async function POST(request) {
  try {
    const { userId, cartItems, paymentToken, shippingAddressId, shippingDetails } = await request.json();

    // 1. Vérifier que les infos sont bien là
    if (!userId || !cartItems || cartItems.length === 0 || !paymentToken || !shippingAddressId || !shippingDetails) {
      return NextResponse.json({ message: 'Données de commande incomplètes ou manquantes.' }, { status: 400 });
    }

    // 2. Vérifier que le paiement est valide avec le fournisseur
    // Cette fonction (verifyPaymentToken) est cruciale et doit être implémentée
    // pour communiquer avec le service de paiement (ex: Kkiapay, Kakapay)
    // pour valider le token et obtenir les détails réels du paiement (montant, devise, transactionId).
    const paymentVerificationResult = await verifyPaymentToken(paymentToken);

    if (!paymentVerificationResult.isValid) {
      return NextResponse.json({ error: paymentVerificationResult.message || 'Paiement invalide ou non vérifié.' }, { status: 400 });
    }

    const {
      amount: verifiedAmount,
      currency: verifiedCurrency,
      transactionId: verifiedTransactionId,
      paymentMethod: verifiedPaymentMethod,
    } = paymentVerificationResult;

    // Calculer le total des articles du panier pour une vérification côté serveur
    const calculatedTotal = calculateTotal(cartItems);

    // Vérification de la cohérence des montants (très important pour la sécurité)
    // Adapte la tolérance si nécessaire pour les flottants
    if (Math.abs(calculatedTotal - verifiedAmount) > 0.01) {
      console.error(`Incohérence de montant: Calculé ${calculatedTotal}, Vérifié ${verifiedAmount}`);
      return NextResponse.json({ error: 'Incohérence de montant détectée. Paiement rejeté.' }, { status: 400 });
    }

    // 3. Enregistrer la commande et le paiement dans une transaction Prisma
    const newOrder = await prisma.$transaction(async (tx) => {
      // Récupérer l'adresse de livraison complète pour les champs de commande
      const shippingAddress = await tx.address.findUnique({
        where: { id: shippingAddressId },
        select: {
          fullName: true,
          area: true,
          city: true,
          state: true,
          pincode: true,
          // country: true, // Assurez-vous que 'country' est dans votre modèle Address si nécessaire
        },
      });

      if (!shippingAddress) {
        throw new Error('Adresse de livraison non trouvée.');
      }

      // Créer la commande
      const order = await tx.order.create({
        data: {
          userId: userId,
          totalAmount: verifiedAmount, // Utilise le montant vérifié par le fournisseur de paiement
          status: 'PAID_SUCCESS', // Statut de la commande après paiement réussi
          paymentStatus: 'COMPLETED', // Statut du paiement de la commande
          kakapayTransactionId: verifiedTransactionId, // Si tu utilises Kakapay/Kkiapay, sinon null
          shippingAddressLine1: shippingAddress.area, // Assurez-vous que 'area' est le bon champ pour Line1
          shippingAddressLine2: shippingAddress.pincode || '', // Assurez-vous que 'pincode' est le bon champ pour Line2
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state,
          shippingZipCode: shippingAddress.pincode || 'N/A', // Assurez-vous que 'pincode' est le bon champ pour ZipCode
          shippingCountry: shippingDetails.country || 'Benin', // Si le pays vient des shippingDetails
          shippingAddressId: shippingAddressId, // Lien vers l'ID de l'adresse
          // orderDate est géré par @default(now()) dans le schéma Prisma
        },
      });

      // Insérer les articles de la commande
      const orderItemsData = cartItems.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: item.price,
        name: item.name, // Assurez-vous que 'name' et 'imgUrl' sont passés dans le payload des items
        imgUrl: item.imgUrl,
      }));

      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      // Créer l'enregistrement de paiement lié
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: verifiedAmount,
          currency: verifiedCurrency,
          paymentMethod: verifiedPaymentMethod,
          status: 'COMPLETED',
          transactionId: verifiedTransactionId,
          paymentDate: new Date(), // Date de la confirmation du paiement
          // createdAt est géré par @default(now()) dans le schéma Prisma
        },
      });

      // Vider le panier de l'utilisateur après la commande réussie
      await tx.cartItem.deleteMany({
        where: { userId: userId },
      });

      return order; // Retourne la commande créée
    });

    return NextResponse.json({ success: true, orderId: newOrder.id, message: 'Commande confirmée et paiement enregistré avec succès.' }, { status: 201 });

  } catch (error) {
    console.error('Erreur API /orders/confirm:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de la confirmation de la commande: ' + error.message }, { status: 500 });
  }
}

/**
 * Fonction d'exemple pour calculer le total des articles du panier.
 * @param {Array<object>} items - Tableau d'objets articles (doivent avoir price et quantity).
 * @returns {number} Le total calculé.
 */
function calculateTotal(items) {
  // Assurez-vous que 'price' est un nombre et 'quantity' un entier
  return items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0), 0);
}