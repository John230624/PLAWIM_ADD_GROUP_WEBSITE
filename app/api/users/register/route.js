// app/api/users/register/route.js

import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma'; // Assurez-vous que le chemin est correct vers votre client Prisma
import bcrypt from 'bcryptjs'; // Assurez-vous que bcryptjs est installé

/**
 * Gère la requête POST pour l'inscription d'un nouvel utilisateur.
 * @param {Request} req - L'objet Request de Next.js.
 * @returns {Promise<NextResponse>}
 */
export async function POST(req) {
  try {
    const { email, password, firstName, lastName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'L\'email et le mot de passe sont requis.' }, { status: 400 });
    }

    // 1. Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true }, // Sélectionne juste l'ID pour vérifier l'existence
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Cet email est déjà enregistré.' }, { status: 409 });
    }

    // 2. Hacher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Créer le nouvel utilisateur dans la base de données
    // createdAt et updatedAt sont généralement gérés automatiquement par Prisma
    const newUser = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        firstName: firstName || null, // Définir à null si non fourni
        lastName: lastName || null,  // Définir à null si non fourni
        role: 'USER', // Assigner un rôle par défaut, par exemple 'USER'
      },
      select: { // Sélectionne les champs à retourner, excluant le mot de passe
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ message: 'Inscription réussie !', user: newUser }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de l\'inscription de l\'utilisateur:', error);
    // Gérer l'erreur P2002 (violation de contrainte unique) si jamais elle n'est pas interceptée par findUnique avant
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ message: 'Cet email est déjà enregistré.' }, { status: 409 });
    }
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
  }
}

/**
 * Gère la requête GET (non autorisée pour cette route).
 * @returns {NextResponse}
 */
export async function GET(req) {
  return NextResponse.json({ message: 'Méthode GET non autorisée pour cette route.' }, { status: 405 });
}