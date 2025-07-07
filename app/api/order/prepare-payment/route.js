// app/api/order/prepare-payment/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 
import { v4 as uuidv4 } from 'uuid'; 

// Cette route doit être une méthode GET car elle ne fait que générer un ID
export async function GET(request) { // <-- DOIT ÊTRE GET
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
        console.warn("Accès non autorisé à /api/order/prepare-payment: Pas de session ou user ID manquant.");
        return NextResponse.json({ success: false, message: 'Non authentifié. Veuillez vous connecter.' }, { status: 401 });
    }

    try {
        const transactionId = uuidv4(); 
        console.log(`Génération d'un transactionId pour Kkiapay: ${transactionId}`);

        return NextResponse.json({ success: true, message: 'Transaction ID généré pour Kkiapay.', transactionId: transactionId }, { status: 200 });

    } catch (error) {
        console.error("Erreur lors de la génération du transactionId:", error);
        return NextResponse.json({ success: false, message: `Erreur serveur lors de la préparation du paiement: ${error.message}` }, { status: 500 });
    }
}
