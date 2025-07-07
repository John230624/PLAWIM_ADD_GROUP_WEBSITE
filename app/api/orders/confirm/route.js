import { NextResponse } from 'next/server';
import db from '@/lib/db';  // ta connexion base données (à adapter)
import { verifyPaymentToken } from '@/lib/payment'; // à créer (fonction qui valide le token auprès du fournisseur)

export async function POST(request) {
  try {
    const { userId, cartItems, paymentToken } = await request.json();

    // Vérifier que le paiement est valide avec le fournisseur
    const isValid = await verifyPaymentToken(paymentToken);
    if (!isValid) {
      return NextResponse.json({ error: 'Paiement invalide' }, { status: 400 });
    }

    // Enregistrer la commande dans la base (simplifié)
    const order = await db.order.create({
      data: {
        userId,
        status: 'paid',
        items: JSON.stringify(cartItems), // adapte selon ta BDD
        createdAt: new Date(),
      },
    });

    // Enregistrer le paiement lié
    await db.payment.create({
      data: {
        orderId: order.id,
        token: paymentToken,
        amount: calculateTotal(cartItems),
        createdAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Fonction d'exemple pour calculer le total
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
