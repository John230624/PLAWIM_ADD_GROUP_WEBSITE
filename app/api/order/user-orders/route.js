// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\order\user-orders\route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'; // Utilise la version recommandée de getServerSession
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma'; // Importe le client Prisma
import { headers, cookies } from 'next/headers'; // Nécessaire pour getServerSession dans App Router

// La clé secrète JWT n'est plus directement utilisée ici car getServerSession gère l'authentification.
// Le NEXTAUTH_SECRET dans .env est utilisé par NextAuth en interne.

/**
 * Gère la requête POST pour récupérer les commandes d'un utilisateur authentifié.
 * Note: Traditionnellement, la récupération de données se fait via une requête GET.
 * Si possible, envisagez de changer cette route en GET.
 * @param {Request} request - L'objet Request de Next.js.
 * @returns {Promise<NextResponse>}
 */
export async function POST(request) { // Le fichier original utilisait POST
  // 1. Vérification de la session utilisateur via NextAuth
  const session = await getServerSession(authOptions, {
    headers: headers(),
    cookies: cookies(),
  });

  if (!session || !session.user || !session.user.id) {
    console.warn("Accès non authentifié à l'API /api/order/user-orders.");
    return NextResponse.json({ success: false, message: 'Non authentifié.' }, { status: 401 });
  }

  const userId = session.user.id; // L'ID utilisateur est directement disponible depuis la session

  // 2. Récupération des commandes de l'utilisateur
  try {
    // Utilise prisma.order.findMany pour récupérer les commandes de l'utilisateur
    // Inclut les relations nécessaires pour obtenir les détails complets des commandes,
    // des articles de commande, des produits et des paiements.
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
      include: {
        orderItems: { // Inclut les articles de la commande
          include: {
            product: { // Inclut les détails du produit pour chaque article
              select: {
                name: true,
                imgUrl: true, // Assurez-vous que imgUrl est dans votre modèle Product
              },
            },
          },
        },
        payment: { // Inclut les détails du paiement (relation 1:1)
          select: {
            paymentMethod: true,
            status: true, // Le statut du paiement dans le modèle Payment
            transactionId: true,
            paymentDate: true,
          },
        },
        // Si tu as besoin des détails de l'adresse de livraison, tu peux inclure la relation 'shippingAddress'
        // shippingAddress: true,
      },
      orderBy: {
        orderDate: 'desc', // Trie les commandes par date, de la plus récente à la plus ancienne
      },
    });

    // 3. Traitez les données pour formater les articles de la commande
    const formattedOrders = orders.map(order => {
      const items = order.orderItems.map(item => {
        let itemImgUrl = [];
        // Gère le parsing JSON pour imgUrl depuis Product, similaire à ta logique originale
        if (item.product?.imgUrl) {
          try {
            const parsed = JSON.parse(item.product.imgUrl);
            if (Array.isArray(parsed)) itemImgUrl = parsed;
            else if (typeof parsed === 'string') itemImgUrl = [parsed];
          } catch {
            if (typeof item.product.imgUrl === 'string' && (item.product.imgUrl.startsWith('/') || item.product.imgUrl.startsWith('http'))) {
              itemImgUrl = [item.product.imgUrl];
            }
          }
        }
        return {
          name: item.product?.name,
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder,
          imgUrl: itemImgUrl.length > 0 ? itemImgUrl[0] : '/placeholder-product.png',
        };
      });

      return {
        id: order.id,
        totalAmount: order.totalAmount,
        status: order.status, // Statut de la commande (PENDING, PAID_SUCCESS, etc.)
        paymentStatus: order.paymentStatus, // Statut du paiement de la commande (PENDING, COMPLETED, etc.)
        shippingAddressLine1: order.shippingAddressLine1,
        shippingAddressLine2: order.shippingAddressLine2,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingZipCode: order.shippingZipCode,
        shippingCountry: order.shippingCountry,
        orderDate: order.orderDate,
        paymentMethod: order.payment?.paymentMethod, // Accède à la méthode de paiement via la relation
        paymentStatusDetail: order.payment?.status, // Accède au statut détaillé du paiement via la relation
        paymentTransactionId: order.payment?.transactionId,
        paymentDate: order.payment?.paymentDate,
        items: items, // Les articles de la commande formatés
      };
    });

    return NextResponse.json({ success: true, data: formattedOrders }, { status: 200 });
  } catch (error) {
    console.error("Erreur de base de données lors de la récupération des commandes utilisateur:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur lors de la récupération des commandes" }, { status: 500 });
  }
}

// Si tu souhaites également une route GET pour les commandes utilisateur, tu peux la définir ainsi:
// export async function GET(request) {
//   return POST(request); // Ou dupliquer la logique si nécessaire
// }