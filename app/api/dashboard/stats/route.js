import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { headers, cookies } from 'next/headers';

export async function GET(req) {
  const session = await getServerSession(authOptions, {
    headers: headers(),
    cookies: cookies(),
  });

  if (!session || session.user.role?.toLowerCase() !== 'admin') {
    return NextResponse.json({ message: 'Non autorisé.' }, { status: 403 });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [[{ totalProducts }]] = await connection.execute('SELECT COUNT(id) AS totalProducts FROM products');
    const [[{ totalOrders }]] = await connection.execute('SELECT COUNT(id) AS totalOrders FROM orders');
    const [[{ pendingOrders }]] = await connection.execute(`SELECT COUNT(id) AS pendingOrders FROM orders WHERE status = 'PENDING'`);
    const [[{ totalRevenue }]] = await connection.execute('SELECT COALESCE(SUM(totalAmount), 0) AS totalRevenue FROM orders WHERE status = "COMPLETED"');
    const [[{ totalUsers }]] = await connection.execute('SELECT COUNT(id) AS totalUsers FROM users');

    return NextResponse.json({
      success: true,
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalUsers,
      message: "Dashboard stats fetched successfully."
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ success: false, message: `Server error: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
