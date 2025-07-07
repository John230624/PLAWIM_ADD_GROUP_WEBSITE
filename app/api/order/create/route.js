import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto'; // Node.js >= 16

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

export async function POST(req) {
    let connection;
    try {
        const orderData = await req.json();

        // Vérifier que les infos sont bien là
        if (!orderData || !orderData.userId || !orderData.items || orderData.items.length === 0 || !orderData.amount || !orderData.address) {
            return NextResponse.json({ message: 'Données de commande incomplètes.' }, { status: 400 });
        }

        // Générer un ID unique pour la commande
        const generatedOrderId = randomUUID();

        connection = await mysql.createConnection(dbConfig);
        await connection.beginTransaction();

        // 1️⃣ Insérer la commande dans `orders`
        await connection.execute(
            `INSERT INTO orders (id, userId, totalAmount, status, shippingAddressLine1, shippingAddressLine2, shippingCity, shippingState, shippingZipCode, shippingCountry, shippingAddressId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                generatedOrderId,
                orderData.userId,
                orderData.amount,
                'PENDING',
                orderData.address.area,
                orderData.address.pincode || '',
                orderData.address.city,
                orderData.address.state,
                orderData.address.pincode || 'N/A',
                'Benin',
                orderData.address.id
            ]
        );

        // 2️⃣ Insérer les articles dans `order_items`
        for (const item of orderData.items) {
            await connection.execute(
                `INSERT INTO order_items (id, orderId, productId, quantity, priceAtOrder)
                 VALUES (?, ?, ?, ?, ?)`,
                [randomUUID(), generatedOrderId, item.productId, item.quantity, item.price]
            );
        }

        // 3️⃣ Insérer le paiement dans `payments` (sans foreign key, juste le lien par `orderId`)
        await connection.execute(
            `INSERT INTO payments (id, orderId, amount, currency, paymentMethod, status, transactionId)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                randomUUID(),
                generatedOrderId,
                orderData.amount,
                orderData.currency || 'XOF',
                'Kkiapay',
                'PENDING',
                null // transactionId sera rempli plus tard quand tu auras la confirmation du paiement
            ]
        );

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: 'Commande et paiement enregistrés avec succès.',
            orderId: generatedOrderId
        }, { status: 200 });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Erreur API /order/create:', error);
        return NextResponse.json({ message: 'Erreur serveur: ' + error.message }, { status: 500 });
    } finally {
        if (connection) await connection.end();
    }
}
