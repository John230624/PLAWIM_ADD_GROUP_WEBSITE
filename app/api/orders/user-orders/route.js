// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\orders\user-orders\route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'; // Utilise getServerSession pour le côté serveur
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma'; // Assure-toi que le chemin est correct et que c'est bien 'prisma'
import { headers, cookies } from 'next/headers'; // Nécessaire pour getServerSession dans App Router

/**
 * Gère la requête GET pour récupérer les commandes d'un utilisateur authentifié.
 * @param {Request} request - L'objet Request de Next.js.
 * @returns {Promise<NextResponse>}
 */
export async function GET(request) {
  // 1. Vérification de la session utilisateur via NextAuth (côté serveur)
  const session = await getServerSession(authOptions, {
    headers: headers(),
    cookies: cookies(),
  });

  if (!session || !session.user || !session.user.id) {
    console.warn("Accès non authentifié à l'API /api/orders/user-orders (GET).");
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const userId = session.user.id; // L'ID utilisateur est directement disponible depuis la session

  // 2. Récupération des commandes de l'utilisateur
  try {
    // Utilise prisma.order.findMany pour récupérer les commandes de l'utilisateur
    // Cette version est simple et ne charge pas les articles de commande ou les paiements.
    // Si tu as besoin de ces détails, tu devras ajouter des 'include' ici.
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }, // Trie par date de création, du plus récent au plus ancien
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Erreur de base de données lors de la récupération des commandes utilisateur (GET):", error);
    return NextResponse.json({ error: "Erreur serveur lors de la récupération des commandes." }, { status: 500 });
  }
}

// --- Note Importante ---
// Tu avais précédemment fourni un fichier pour ce même chemin (app/api/orders/user-orders/route.js)
// qui contenait une méthode POST pour récupérer les commandes avec plus de détails (articles, paiements).
//
// Si tu souhaites que ce fichier contienne LES DEUX méthodes (GET et POST),
// tu devras combiner ce code GET avec le code POST que nous avons refactorisé précédemment.
//
// Exemple de combinaison (si tu veux les deux dans le même fichier):
// (Colle le code GET ci-dessus, puis colle le code POST refactorisé en dessous)
//
// export async function POST(request) {
//   // ... (colle ici le contenu refactorisé de ta fonction POST précédente) ...
// }
//
// Si la méthode GET est suffisante pour tes besoins actuels, tu peux simplement utiliser ce fichier.