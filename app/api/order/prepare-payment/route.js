import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions); // ✅ Compatible App Router

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié.' },
        { status: 401 }
      );
    }

    // Exemple : générer un ID de transaction unique
    const transactionId = uuidv4();

    // Tu peux ajouter ici d'autres logiques (ex: réserver un panier, vérifier stock, etc.)

    return NextResponse.json(
      {
        success: true,
        message: 'Préparation du paiement réussie.',
        transactionId,
        user: {
          id: session.user.id,
          email: session.user.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur GET prepare-payment:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur', error: error.message },
      { status: 500 }
    );
  }
}
