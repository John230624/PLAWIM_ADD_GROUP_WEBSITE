// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\order\create\route.js

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Importe le client Prisma
// 'mysql2/promise' n'est plus nécessaire
// 'crypto' et 'randomUUID' ne sont plus nécessaires si Prisma gère les UUIDs via @default(uuid())

export async function POST(req) {
  try {
    const orderData = await req.json();

    // Vérifier que les infos sont bien là
    if (!orderData || !orderData.userId || !orderData.items || orderData.items.length === 0 || orderData.amount === undefined || !orderData.address) {
      return NextResponse.json({ message: 'Données de commande incomplètes.' }, { status: 400 });
    }

    // Prisma générera un ID unique pour la commande si le champ 'id' est @default(uuid())
    // Nous pouvons aussi utiliser un ID fourni si l'on veut le lier à une transaction externe dès le début.
    // Pour cet exemple, nous allons laisser Prisma générer l'ID de la commande,
    // ou si tu veux le lier à une transactionId externe, tu peux le passer ici.
    // Si tu veux utiliser un ID généré côté client ou par un service externe, assure-toi qu'il est unique.
    // Pour l'exemple, nous allons laisser Prisma le générer par défaut.

    // Utilise prisma.$transaction pour garantir l'atomicité des opérations
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1️⃣ Insérer la commande dans `orders`
      const createdOrder = await tx.order.create({
        data: {
          // L'ID de la commande sera généré par Prisma si @default(uuid()) est défini dans schema.prisma
          userId: orderData.userId,
          totalAmount: orderData.amount,
          status: 'PENDING', // Statut initial de la commande
          paymentStatus: 'PENDING', // Statut initial du paiement
          shippingAddressLine1: orderData.address.area, // Assurez-vous que 'area' est le bon champ pour Line1
          shippingAddressLine2: orderData.address.pincode || '', // Assurez-vous que 'pincode' est le bon champ pour Line2
          shippingCity: orderData.address.city,
          shippingState: orderData.address.state,
          shippingZipCode: orderData.address.pincode || 'N/A', // Assurez-vous que 'pincode' est le bon champ pour ZipCode
          shippingCountry: orderData.address.country || 'Benin',
          shippingAddressId: orderData.address.id, // L'ID de l'adresse de livraison
          // orderDate est géré par @default(now()) dans le schéma Prisma
        },
      });

      // 2️⃣ Insérer les articles dans `order_items`
      const orderItemsData = orderData.items.map(item => ({
        orderId: createdOrder.id, // Utilise l'ID de la commande nouvellement créée
        productId: item.productId,
        quantity: item.quantity,
        priceAtOrder: item.price,
        name: item.name, // Assurez-vous que 'name' et 'imgUrl' sont passés dans le payload des items
        imgUrl: item.imgUrl,
        // createdAt est géré par @default(now()) dans le schéma Prisma
      }));

      await tx.orderItem.createMany({
        data: orderItemsData,
      });

      // 3️⃣ Insérer le paiement dans `payments`
      await tx.payment.create({
        data: {
          orderId: createdOrder.id, // Lier au nouvel ID de commande
          amount: orderData.amount,
          currency: orderData.currency || 'XOF',
          paymentMethod: 'Kkiapay', // Méthode de paiement initiale
          status: 'PENDING', // Statut initial du paiement
          transactionId: null, // Sera rempli par le webhook Kkiapay
          // paymentDate et createdAt sont gérés par @default(now()) dans le schéma Prisma
        },
      });

      // 4️⃣ Vider le panier de l'utilisateur après la création de la commande
      // Assurez-vous que le userId est disponible pour vider le panier
      await tx.cartItem.deleteMany({
        where: {
          userId: orderData.userId,
        },
      });

      return createdOrder; // Retourne la commande créée pour l'utiliser dans la réponse
    });

    return NextResponse.json({
      success: true,
      message: 'Commande et paiement enregistrés avec succès.',
      orderId: newOrder.id,
    }, { status: 200 });

  } catch (error) {
    // Prisma gère automatiquement le rollback en cas d'erreur dans la transaction
    console.error('Erreur API /order/create:', error);
    return NextResponse.json({ message: 'Erreur serveur: ' + error.message }, { status: 500 });
  }
  // Pas de bloc `finally` nécessaire avec Prisma
}