// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\admin\orders\route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'; // Use next/next for latest getServerSession
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma'; // Import the Prisma client
import { headers, cookies } from 'next/headers';

/**
 * Authorization function to check if the user is authenticated and has the 'ADMIN' role.
 * @returns {Promise<{authorized: boolean, response?: NextResponse}>}
 */
async function authorizeAdmin() {
  const session = await getServerSession(authOptions, {
    headers: headers(),
    cookies: cookies(),
  });

  if (!session || !session.user) {
    console.warn("Unauthorized access attempt to /api/admin/orders API.");
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Unauthorized.' }, { status: 401 }),
    };
  }

  // Ensure the role is included in the session/token via NextAuth callbacks
  // as configured in lib/authOptions.js
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
    // Use prisma.order.findMany to fetch all orders with their related user, order items, and payments.
    const orders = await prisma.order.findMany({
      include: {
        user: { // Include user details
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true, // Assuming phoneNumber is on the User model
          },
        },
        orderItems: { // Include order items
          include: {
            product: { // Include product details for each order item
              select: {
                id: true,
                name: true,
                imgUrl: true, // Assuming imgUrl is directly on the Product model
              },
            },
          },
        },
        payment: { // Include payment details (it's a 1-to-1 relation, so it's directly here)
          select: {
            paymentMethod: true,
            status: true, // Renamed to 'status' in Payment model (was 'paymentStatusDetail')
            transactionId: true,
            paymentDate: true,
          },
        },
      },
      orderBy: {
        orderDate: 'desc', // Sort orders by date, from newest to oldest
      },
    });

    // Map the results to match the structure of your original SQL query output,
    // especially for concatenated names and image URLs.
    const formattedOrders = orders.map(order => {
      const userFullName = `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.trim();

      const parsedItems = order.orderItems.map(item => {
        let itemImgUrl = [];
        // Handle JSON parsing for imgUrl from Product, similar to your original logic
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
          // Take the first image URL or a placeholder
          imgUrl: itemImgUrl.length > 0 ? itemImgUrl[0] : '/placeholder-product.png',
        };
      });

      return {
        id: order.id,
        totalAmount: order.totalAmount,
        orderStatus: order.status, // Directly use the enum value
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
        paymentStatusDetail: order.payment?.status, // Use the enum value
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
  // No `finally` block with `connection.release()` needed with Prisma
}