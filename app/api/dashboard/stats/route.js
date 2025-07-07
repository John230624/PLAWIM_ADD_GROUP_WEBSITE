// app/api/dashboard/stats/route.js
import { NextResponse } from 'next/server';
import pool from '../../../../lib/db'; // Ajustez ce chemin si nécessaire
import { getServerSession } from 'next-auth'; // Nécessaire si vous voulez protéger cette API
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Assurez-vous que le chemin est correct

export async function GET() {
    // Optionnel: Protéger cette API si seuls les admins doivent y accéder
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role?.toLowerCase() !== 'admin') {
    //     return NextResponse.json({ message: 'Accès interdit.' }, { status: 403 });
    // }

    let connection;
    try {
        connection = await pool.getConnection();

        // 1. Total Products
        const [productsCountResult] = await connection.execute('SELECT COUNT(id) AS totalProducts FROM products');
        const totalProducts = productsCountResult[0].totalProducts;

        // 2. Total Orders
        const [ordersCountResult] = await connection.execute('SELECT COUNT(id) AS totalOrders FROM orders');
        const totalOrders = ordersCountResult[0].totalOrders;

        // 3. Pending Orders (Example: assuming a 'status' column in 'orders' table)
        const [pendingOrdersResult] = await connection.execute(`SELECT COUNT(id) AS pendingOrders FROM orders WHERE status = 'PENDING'`); // Utilisez 'PENDING' si c'est la valeur dans votre DB
        const pendingOrders = pendingOrdersResult[0].pendingOrders;

        // 4. Total Revenue (Example: sum of 'totalAmount' from 'orders' table)
        const [revenueResult] = await connection.execute('SELECT SUM(totalAmount) AS totalRevenue FROM orders WHERE status = "COMPLETED"'); // Utilisez 'COMPLETED'
        const totalRevenue = revenueResult[0].totalRevenue || 0;

        // 5. Total Users - DÉCOMMENTÉ ET ACTIVÉ
        const [usersCountResult] = await connection.execute('SELECT COUNT(id) AS totalUsers FROM users');
        const totalUsers = usersCountResult[0].totalUsers;

        return NextResponse.json({
            success: true,
            totalProducts,
            totalOrders,
            pendingOrders,
            totalRevenue,
            totalUsers, // Inclus dans la réponse
            message: "Dashboard stats fetched successfully."
        }, { status: 200 });

    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return NextResponse.json({ success: false, message: `Server error fetching dashboard stats: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
