// app/api/admin/orders/route.js

import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function GET(request) {
  const session = await getServerSession(request, authOptions);

  if (!session || !session.user) {
    console.warn("Accès non authentifié à l'API /api/admin/orders.");
    return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 });
  }

  if (session.user.role?.toLowerCase() !== 'admin') {
    console.warn(`Accès non autorisé à l'API /api/admin/orders par l'utilisateur ${session.user.id} (Rôle: ${session.user.role || 'Aucun'})`);
    return NextResponse.json({ message: 'Accès interdit. Seuls les administrateurs peuvent voir cette page.' }, { status: 403 });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [orders] = await connection.execute(
      `SELECT
          o.id,
          o.totalAmount,
          o.status AS orderStatus,
          o.shippingAddressLine1,
          o.shippingAddressLine2,
          o.shippingCity,
          o.shippingState,
          o.shippingZipCode,
          o.shippingCountry,
          o.orderDate,
          CONCAT(u.firstName, ' ', u.lastName) AS userName,
          u.email AS userEmail,
          u.phoneNumber AS userPhoneNumber,
          p.paymentMethod,
          p.status AS paymentStatusDetail,
          p.transactionId AS paymentTransactionId,
          p.paymentDate
      FROM orders o
      JOIN users u ON o.userId = u.id
      LEFT JOIN payments p ON o.id = p.orderId
      ORDER BY o.orderDate DESC`
    );

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const [items] = await connection.execute(
          `SELECT productId, quantity, priceAtOrder, name, imgUrl
           FROM order_items
           WHERE orderId = ?`,
          [order.id]
        );

        const parsedItems = items.map((item) => {
          let itemImgUrl = [];

          if (item.imgUrl) {
            try {
              const parsed = JSON.parse(item.imgUrl);
              if (Array.isArray(parsed)) {
                itemImgUrl = parsed;
              } else if (typeof parsed === 'string') {
                itemImgUrl = [parsed];
              }
            } catch {
              if (typeof item.imgUrl === 'string' && (item.imgUrl.startsWith('/') || item.imgUrl.startsWith('http'))) {
                itemImgUrl = [item.imgUrl];
              } else {
                itemImgUrl = [];
              }
            }
          }

          return {
            ...item,
            imgUrl: itemImgUrl.length > 0 ? itemImgUrl[0] : '/placeholder-product.png',
          };
        });

        return { ...order, items: parsedItems };
      })
    );

    return NextResponse.json(ordersWithItems, { status: 200 });
  } catch (error) {
    console.error("Erreur CRITIQUE dans l'API /api/admin/orders:", error);
    return NextResponse.json(
      { message: "Erreur serveur lors de la récupération des commandes.", error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
