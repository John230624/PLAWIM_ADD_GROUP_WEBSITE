import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assurez-vous que le chemin est correct
import { getServerSession } from 'next-auth/next'; // Correct pour l'App Router
import { authOptions } from '@/lib/authOptions';

async function authorizeUser(userIdFromParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.warn(`Tentative d'accès non authentifiée à /api/orders/${userIdFromParams}`);
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }),
    };
  }

  if (String(session.user.id) !== String(userIdFromParams)) {
    console.warn(`Tentative d'accès non autorisé à /api/orders/${userIdFromParams} par userId ${session.user.id}`);
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Non autorisé. Cet historique de commandes ne vous appartient pas.' }, { status: 403 }),
    };
  }

  return { authorized: true, userId: userIdFromParams, session };
}

export async function GET(req, context) {
  // Accès direct à userId via context.params
  const { userId } = context.params;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: userId,
      },
      include: {
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
      const parsedItems = order.orderItems.map(item => {
        let itemImgUrl = [];
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
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: item.priceAtOrder,
          name: item.product?.name,
          imgUrl: itemImgUrl.length > 0 ? itemImgUrl[0] : '/placeholder-product.png',
        };
      });

      return {
        id: order.id,
        totalAmount: order.totalAmount,
        orderStatus: order.status,
        // Supprimé paymentStatus car redondant avec payment.status
        shippingAddressLine1: order.shippingAddressLine1,
        shippingAddressLine2: order.shippingAddressLine2,
        shippingCity: order.shippingCity,
        shippingState: order.shippingState,
        shippingZipCode: order.shippingZipCode,
        shippingCountry: order.shippingCountry,
        orderDate: order.orderDate,
        paymentMethod: order.payment?.paymentMethod,
        paymentStatusDetail: order.payment?.status,
        paymentDate: order.payment?.paymentDate,
        paymentTransactionId: order.payment?.transactionId,
        items: parsedItems,
      };
    });

    return NextResponse.json(formattedOrders, { status: 200 });
  } catch (error) {
    console.error("Erreur GET commandes:", error);
    return NextResponse.json({ message: "Erreur serveur lors de la récupération des commandes.", error: error.message }, { status: 500 });
  }
}