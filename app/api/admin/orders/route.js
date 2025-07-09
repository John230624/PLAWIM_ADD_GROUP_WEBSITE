// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\admin\orders\route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';
// SUPPRIMER CES IMPORTS :
// import { headers, cookies } from 'next/headers';

/**
 * Authorization function to check if the user is authenticated and has the 'ADMIN' role.
 * @returns {Promise<{authorized: boolean, response?: NextResponse}>}
 */
async function authorizeAdmin() {
  // CORRECTION ICI : Appelle getServerSession SANS le deuxième argument
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.warn("Unauthorized access attempt to /api/admin/orders API.");
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Unauthorized.' }, { status: 401 }),
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
export async function GET(req) {
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