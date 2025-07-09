import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role?.toLowerCase() !== 'admin') {
    console.warn("Accès non autorisé aux statistiques du tableau de bord.");
    return NextResponse.json({ message: 'Non autorisé.' }, { status: 403 });
  }

  try {
    const [
      totalProducts,
      totalOrders,
      pendingOrders,
      totalRevenueResult,
      totalUsers
    ] = await prisma.$transaction([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({
        where: { status: 'PENDING' }, // Vérifié dans ton enum
      }),
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          status: 'PAID_SUCCESS', // ✅ Correction ici
        },
      }),
      prisma.user.count(),
    ]);

    const totalRevenue = totalRevenueResult._sum.totalAmount || 0;

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
    console.error("Erreur lors de la récupération des statistiques du tableau de bord:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  }
}
