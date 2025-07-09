import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req) {
  try {
    // Récupération de la session de l'utilisateur connecté
    const session = await getServerSession(authOptions);

    // Vérifier si l'utilisateur est authentifié
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié.' },
        { status: 401 }
      );
    }

    // Générer un identifiant unique pour la transaction
    const transactionId = uuidv4();

    // TODO: Ajouter ici d'autres logiques métiers, par exemple :
    // - Vérification du stock
    // - Réservation du panier
    // - Calcul du total, etc.

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
