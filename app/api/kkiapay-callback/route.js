import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import axios from 'axios';

const KKIA_PRIVATE_API_KEY = process.env.KKIAPAY_PRIVATE_API_KEY;
const KKIA_ENV = process.env.KKIAPAY_ENV || 'sandbox'; // 'sandbox' ou 'production'

const API_BASE_URL = KKIA_ENV === 'production'
  ? 'https://api.kkiapay.me/v1'
  : 'https://api.kkiapay.me/v1';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transactionId');
  const reference = searchParams.get('reference');

  console.log("✅ [KKIAPAY CALLBACK] transactionId:", transactionId);

  if (!transactionId) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/order-status?status=error&message=${encodeURIComponent('TransactionId manquant')}`
    );
  }

  if (!KKIA_PRIVATE_API_KEY) {
    return NextResponse.redirect(
      `${request.nextUrl.origin}/order-status?status=error&message=${encodeURIComponent('Clé API privée manquante')}`
    );
  }

  try {
    // Requête GET pour vérifier la transaction dans sandbox ou prod
    const verificationResponse = await axios.get(`${API_BASE_URL}/transactions/${transactionId}`, {
      headers: { 'x-api-key': KKIA_PRIVATE_API_KEY },
    });

    const data = verificationResponse.data;
    console.log("✅ [KKIAPAY CALLBACK] Vérification:", data);

    if (data.status !== 'SUCCESS') {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/order-status?orderId=${transactionId}&status=failed&message=${encodeURIComponent('Paiement non vérifié')}`
      );
    }

    // Extraction du payload JSON de la commande
    const orderPayload = data.data ? JSON.parse(data.data) : null;

    if (!orderPayload || !orderPayload.userId || !orderPayload.items || !orderPayload.shippingAddress) {
      return NextResponse.redirect(
        `${request.nextUrl.origin}/order-status?status=error&message=${encodeURIComponent('Payload incomplet')}`
      );
    }

    const orderId = reference || transactionId;

    // Création / mise à jour de la commande dans la BDD
    await prisma.$transaction(async (tx) => {
      await tx.order.upsert({
        where: { id: orderId },
        update: {
          userId: orderPayload.userId,
          totalAmount: orderPayload.totalAmount,
          status: 'PAID_SUCCESS',
          paymentStatus: 'COMPLETED',
          shippingAddressLine1: orderPayload.shippingAddress.fullName || '',
          shippingAddressLine2: orderPayload.shippingAddress.area || '',
          shippingCity: orderPayload.shippingAddress.city || '',
          shippingState: orderPayload.shippingAddress.state || '',
          shippingZipCode: orderPayload.shippingAddress.pincode || '',
          shippingCountry: orderPayload.shippingAddress.country || 'Bénin',
        },
        create: {
          id: orderId,
          userId: orderPayload.userId,
          totalAmount: orderPayload.totalAmount,
          status: 'PAID_SUCCESS',
          paymentStatus: 'COMPLETED',
          shippingAddressLine1: orderPayload.shippingAddress.fullName || '',
          shippingAddressLine2: orderPayload.shippingAddress.area || '',
          shippingCity: orderPayload.shippingAddress.city || '',
          shippingState: orderPayload.shippingAddress.state || '',
          shippingZipCode: orderPayload.shippingAddress.pincode || '',
          shippingCountry: orderPayload.shippingAddress.country || 'Bénin',
        },
      });

      await tx.orderItem.deleteMany({ where: { orderId } });

      await tx.orderItem.createMany({
        data: orderPayload.items.map(item => ({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          priceAtOrder: item.price,
          name: item.name,
          imgUrl: item.imgUrl,
        })),
        skipDuplicates: true,
      });

      await tx.payment.upsert({
        where: { orderId },
        update: {
          paymentMethod: data.paymentMethod || 'Mobile Money',
          transactionId,
          amount: data.amount,
          currency: orderPayload.currency,
          status: 'COMPLETED',
          paymentDate: new Date(),
        },
        create: {
          orderId,
          paymentMethod: data.paymentMethod || 'Mobile Money',
          transactionId,
          amount: data.amount,
          currency: orderPayload.currency,
          status: 'COMPLETED',
          paymentDate: new Date(),
        },
      });

      await tx.cartItem.deleteMany({ where: { userId: orderPayload.userId } });
    });

    return NextResponse.redirect(`${request.nextUrl.origin}/order-status?orderId=${orderId}&status=success`);

  } catch (error) {
    console.error("❌ [KKIAPAY CALLBACK] Erreur:", error.message);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/order-status?status=error&message=${encodeURIComponent('Erreur interne du serveur')}`
    );
  }
}

export async function POST(request) {
  // Tu peux traiter POST pareil que GET ou l’interdire
  return GET(request);
}
