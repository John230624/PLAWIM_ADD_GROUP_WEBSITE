// app/api/orders/[userId]/route.js
import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';


// Fonction utilitaire d'autorisation (réutilisable)
async function authorizeUser(req, context) {
    const session = await getServerSession(authOptions);
    // ATTENTION: await context.params pour éviter l'avertissement Next.js
    const { userId: userIdFromParams } = await context.params; 

    console.log("Authorization Check:");
    console.log("  Session user ID:", session?.user?.id);
    console.log("  URL user ID (from params):", userIdFromParams);

    if (!session) {
        console.warn(`Tentative d'accès non authentifiée à /api/orders/${userIdFromParams}`);
        return { authorized: false, response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }) };
    }
    
    // Comparaison des IDs après conversion en chaîne pour s'assurer du même type
    if (String(session.user.id) !== String(userIdFromParams)) {
        console.warn(`Tentative d'accès non autorisé à /api/orders/${userIdFromParams} par userId ${session.user.id}`);
        return { authorized: false, response: NextResponse.json({ message: 'Non autorisé. Cet historique de commandes ne vous appartient pas.' }, { status: 403 }) };
    }
    return { authorized: true, userId: userIdFromParams };
}

// GET: Récupérer les commandes d'un utilisateur
export async function GET(req, context) {
    const authResult = await authorizeUser(req, context);
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

        const ordersWithItems = await Promise.all(orders.map(async (order) => {
            const [items] = await connection.execute(
                `SELECT productId, quantity, priceAtOrder, name, imgUrl FROM \`order_items\` WHERE orderId = ?`,
                [order.id]
            );
            const parsedItems = items.map(item => {
                let itemImgUrl = [];
                if (item.imgUrl) {
                    try {
                        const parsed = JSON.parse(item.imgUrl);
                        if (Array.isArray(parsed)) {
                            itemImgUrl = parsed;
                        } else if (typeof parsed === 'string') {
                            itemImgUrl = [parsed];
                        }
                    } catch (e) {
                        if (typeof item.imgUrl === 'string' && item.imgUrl.startsWith('/')) {
                            itemImgUrl = [item.imgUrl];
                        } else {
                            itemImgUrl = [];
                        }
                        console.warn("Impossible de parser order_item.imgUrl comme tableau JSON, traité comme URL unique ou tableau vide:", item.imgUrl, e);
                    }
                }
                // Assurez-vous d'avoir assets.default_product_image défini ou utilisez un placeholder
                return { ...item, imgUrl: itemImgUrl.length > 0 ? itemImgUrl[0] : '/placeholder-product.png' }; 
            });
            return { ...order, items: parsedItems };
        }));

        return NextResponse.json(ordersWithItems, { status: 200 });
    } catch (error) {
        console.error("Erreur GET commandes:", error);
        return NextResponse.json({ message: "Erreur serveur lors de la récupération des commandes.", error: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
