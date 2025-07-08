import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { headers, cookies } from 'next/headers';

async function authorizeUser(context) {
  const session = await getServerSession(authOptions, headers(), cookies());
  const { userId: userIdFromParams } = context.params;

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

  return { authorized: true, userId: userIdFromParams };
}

export async function GET(req, context) {
  const authResult = await authorizeUser(context);
  if (!authResult.authorized) return authResult.response;
  const userId = authResult.userId;

  let connection;
  try {
    connection = await pool.getConnection();

    const [orders] = await connection.execute(
      `SELECT 
          o.id, o.totalAmount, o.status AS orderStatus, o.paymentStatus, 
          o.shippingAddressLine1, o.shippingAddressLine2, o.shippingCity, 
          o.shippingState, o.shippingZipCode, o.shippingCountry, o.orderDate,
          p.paymentMethod, p.status AS paymentStatusDetail, p.paymentDate, p.transactionId AS paymentTransactionId
       FROM \`orders\` o
       LEFT JOIN \`payments\` p ON o.id = p.orderId
       WHERE o.userId = ?
       ORDER BY o.orderDate DESC`,
      [userId]
    );

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await connection.execute(
          `SELECT productId, quantity, priceAtOrder, name, imgUrl FROM \`order_items\` WHERE orderId = ?`,
          [order.id]
        );

        const parsedItems = items.map(item => {
          let itemImgUrl = [];
          if (item.imgUrl) {
            try {
              const parsed = JSON.parse(item.imgUrl);
              if (Array.isArray(parsed)) itemImgUrl = parsed;
              else if (typeof parsed === 'string') itemImgUrl = [parsed];
            } catch (e) {
              if (typeof item.imgUrl === 'string' && item.imgUrl.startsWith('/')) {
                itemImgUrl = [item.imgUrl];
              }
            }
          }
          return { ...item, imgUrl: itemImgUrl.length > 0 ? itemImgUrl[0] : '/placeholder-product.png' };
        });

        return { ...order, items: parsedItems };
      })
    );

    return NextResponse.json(ordersWithItems, { status: 200 });
  } catch (error) {
    console.error("Erreur GET commandes:", error);
    return NextResponse.json({ message: "Erreur serveur lors de la récupération des commandes.", error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
