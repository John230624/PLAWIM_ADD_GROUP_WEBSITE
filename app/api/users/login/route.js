// app/api/users/login/route.js

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma'; // Assure-toi que le chemin est correct vers ton client Prisma
import bcrypt from 'bcryptjs'; // Assure-toi que bcryptjs est installé

/**
 * Gère la requête POST pour la connexion d'un utilisateur.
 * @param {Request} req - L'objet Request de Next.js.
 * @returns {Promise<NextResponse>}
 */
export async function POST(req) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'L\'email et le mot de passe sont requis.' }, { status: 400 });
    }

    // Utilise prisma.user.findUnique pour trouver l'utilisateur par email
    // Sélectionne explicitement le mot de passe pour la comparaison
    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { // Sélectionne les champs nécessaires, y compris le mot de passe
        id: true,
        email: true,
        password: true, // Inclut le mot de passe pour la comparaison bcrypt
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      // Si aucun utilisateur n'est trouvé, renvoyer un message générique pour des raisons de sécurité
      return NextResponse.json({ message: 'Identifiants invalides.' }, { status: 401 });
    }

    // Compare le mot de passe fourni avec le mot de passe hashé de l'utilisateur
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Si les mots de passe ne correspondent pas
      return NextResponse.json({ message: 'Identifiants invalides.' }, { status: 401 });
    }

    // Destructure l'objet utilisateur pour exclure le mot de passe avant de l'envoyer au client
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ message: 'Connexion réussie !', user: userWithoutPassword }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la connexion de l\'utilisateur:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
  }
  // Pas de bloc 'finally' nécessaire avec Prisma, la gestion des connexions est automatique.
}

/**
 * Gère la requête GET (non autorisée pour cette route).
 * @returns {NextResponse}
 */
export async function GET(req) {
  return NextResponse.json({ message: 'Méthode GET non autorisée pour cette route.' }, { status: 405 });
}