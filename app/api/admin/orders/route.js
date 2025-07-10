// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\admin\orders\route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
// import { headers, cookies } from 'next/headers'; // Pas nécessaire ici, getServerSession les gère

// Fonction utilitaire pour autoriser l'utilisateur (ADMIN)
async function authorizeAdmin() {
  // CORRECTION: Enlève les options headers et cookies, getServerSession les gère automatiquement dans les Route Handlers
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.warn("Unauthorized access attempt to /api/admin/orders API.");
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }),
    };
  }

  if (session.user.role?.toLowerCase() !== 'admin') {
    console.warn(`Forbidden access attempt to /api/admin/orders API by user ${session.user.id} (Role: ${session.user.role || 'None'})`);
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Access denied. Only administrators can view this page.' }, { status: 403 }),
    };
  }

  return { authorized: true };
}

/**
 * Handles the GET request to retrieve all orders (for administrators).
 * Includes user information and order item details.
 * @param {Request} req - The Next.js Request object.
 * @returns {Promise<NextResponse>}
 */
export async function GET(req) { // Pas de 'context' ici car pas de paramètres dynamiques
  const authResult = await authorizeAdmin();
  if (!authResult.authorized) return authResult.response;

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imgUrl: true,
              },
            },
          },
        },
        payment: {
          select: {
            paymentMethod: true,
            status: true,
            transactionId: true,
            paymentDate: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    });

    const formattedOrders = orders.map(order => {
      const userFullName = `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim();

      const parsedItems = order.orderItems.map(item => {
        let itemImgUrl = '/placeholder-product.png'; // Valeur par défaut

        // Simplification de la logique d'image: s'attend à une simple chaîne
        if (item.product?.imgUrl && typeof item.product.imgUrl === 'string' && item.product.imgUrl.trim() !== '') {
          itemImgUrl = item.product.imgUrl;
        }
        return {
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder,
          name: item.product?.name,
          imgUrl: itemImgUrl,
        };
      });

      return {
        id: order.id,
        totalAmount: order.totalAmount,
        orderStatus: order.status,
        shippingAddressLine1: order.shippingAddressLine1,
        shippingAddressLine2: order.shippingAddressLine2,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingZipCode: order.shippingZipCode,
        shippingCountry: order.shippingCountry,
        orderDate: order.orderDate,
        userName: userFullName,
        userEmail: order.user?.email,
        userPhoneNumber: order.user?.phoneNumber,
        paymentMethod: order.payment?.paymentMethod,
        paymentStatusDetail: order.payment?.status,
        paymentTransactionId: order.payment?.transactionId,
        paymentDate: order.payment?.paymentDate,
        items: parsedItems,
      };
    });

    return NextResponse.json(formattedOrders, { status: 200 });
  } catch (error) {
    console.error("CRITICAL Error in /api/admin/orders API (GET):", error);
    return NextResponse.json(
      { message: "Server error retrieving orders.", error: error.message },
      { status: 500 }
    );
  }
}
// Pas d'autres fonctions POST, PUT, DELETE dans ce fichier si c'est une route pour toutes les commandes.
// Si vous avez des routes pour des commandes spécifiques (ex: /api/admin/orders/[orderId]), elles devraient être dans un fichier [orderId]/route.js