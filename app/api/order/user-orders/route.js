// app/api/order/user-orders/route.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import db from '@/lib/db'; // Assurez-vous que le chemin est correct pour votre connexion DB

// !!! IMPORTANT: Utilisez la même clé secrète JWT que celle utilisée pour générer le token lors de la connexion
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_jwt'; // Mettez votre clé secrète réelle ici ou dans les variables d'environnement

// Fonction d'aide pour vérifier le token JWT
const verifyToken = (request) => {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { error: 'No token provided or invalid format', userId: null };
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        return { error: null, userId: decoded.id }; // Supposons que l'ID de l'utilisateur est stocké dans 'id' du payload JWT
    } catch (error) {
        console.error("Token verification failed:", error);
        return { error: 'Failed to authenticate token', userId: null };
    }
};

export async function POST(request) {
    // 1. Vérification du token
    const { error, userId } = verifyToken(request);

    if (error) {
        return NextResponse.json({ success: false, message: error }, { status: 403 });
    }

    // 2. Vérification que l'userId est bien présent après la vérification
    if (!userId) {
        return NextResponse.json({ success: false, message: "User ID not found after token verification" }, { status: 401 });
    }

    // 3. Récupération des commandes de l'utilisateur
    try {
        // Utilisez une requête JOIN pour récupérer les détails des articles de la commande
        // et les informations de l'adresse de livraison directement depuis la table 'orders'
        // ainsi que le nom du produit depuis la table 'products'.
        const [ordersData] = await db.query(
            `SELECT
                o.id,
                o.totalAmount,
                o.status,
                o.paymentStatus,
                o.shippingAddressLine1,
                o.shippingAddressLine2,
                o.shippingCity,
                o.shippingState,
                o.shippingZipCode,
                o.shippingCountry,
                o.orderDate,
                o.paymentMethod,
                GROUP_CONCAT(JSON_OBJECT('name', p.name, 'quantity', oi.quantity, 'priceAtOrder', oi.priceAtOrder)) AS items_json
            FROM orders o
            JOIN order_items oi ON o.id = oi.orderId
            JOIN products p ON oi.productId = p.id
            WHERE o.userId = ?
            GROUP BY o.id
            ORDER BY o.orderDate DESC`,
            [userId]
        );

        // Traitez les données pour parser le JSON des articles
        const orders = ordersData.map(order => ({
            ...order,
            items: JSON.parse(`[${order.items_json}]`) // Parse le GROUP_CONCAT en tableau d'objets
        }));

        return NextResponse.json({ success: true, data: orders }, { status: 200 });
    } catch (dbError) {
        console.error("Database error fetching user orders:", dbError);
        return NextResponse.json({ success: false, message: "Erreur serveur lors de la récupération des commandes" }, { status: 500 });
    }
}