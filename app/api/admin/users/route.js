// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\admin\users\route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'; // Utilise next/next pour getServerSession
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma'; // Importe le client Prisma
import { headers, cookies } from 'next/headers';

/**
 * Fonction d'autorisation pour les administrateurs.
 * Vérifie si l'utilisateur est authentifié et a le rôle 'ADMIN'.
 * @returns {Promise<{authorized: boolean, response?: NextResponse}>}
 */
async function authorizeAdmin() {
  const session = await getServerSession(authOptions, {
    headers: headers(),
    cookies: cookies(),
  });

  if (!session || !session.user) {
    console.warn("Accès non authentifié à l'API admin/users.");
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }),
    };
  }

  // Assure-toi que le rôle est bien inclus dans la session/token via les callbacks de NextAuth
  // comme configuré dans lib/authOptions.js
  if (session.user.role?.toLowerCase() !== 'admin') {
    console.warn(`Accès non autorisé à l'API admin/users par utilisateur ${session.user.id} (Rôle: ${session.user.role || 'Aucun'})`);
    return {
      authorized: false,
      response: NextResponse.json({
        message: 'Accès interdit. Seuls les administrateurs peuvent gérer les utilisateurs.',
      }, { status: 403 }),
    };
  }

  return { authorized: true };
}

/**
 * Gère la requête GET pour récupérer la liste des utilisateurs (pour les administrateurs).
 * Permet de filtrer par rôle 'user'.
 * @param {Request} req - L'objet Request de Next.js.
 * @returns {Promise<NextResponse>}
 */
export async function GET(req) {
  const authResult = await authorizeAdmin();
  if (!authResult.authorized) return authResult.response;

  try {
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role');

    const whereClause = {};
    if (roleFilter && roleFilter.toLowerCase() === 'user') {
      whereClause.role = 'USER'; // Utilise la valeur de l'enum définie dans Prisma
    }

    // Utilise prisma.user.findMany pour récupérer les utilisateurs
    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      select: { // Sélectionne explicitement les champs nécessaires
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const formattedUsers = users.map(user => ({
      ...user,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    }));

    return NextResponse.json(formattedUsers, { status: 200 });
  } catch (error) {
    console.error("Erreur GET utilisateurs:", error);
    return NextResponse.json({
      message: "Erreur serveur lors de la récupération des utilisateurs.",
      error: error.message,
    }, { status: 500 });
  }
}

/**
 * Gère la requête PUT pour mettre à jour le rôle d'un utilisateur (pour les administrateurs).
 * @param {Request} req - L'objet Request de Next.js.
 * @returns {Promise<NextResponse>}
 */
export async function PUT(req) {
  const authResult = await authorizeAdmin();
  if (!authResult.authorized) return authResult.response;

  const { id, role } = await req.json();

  if (!id || !role) {
    return NextResponse.json({ success: false, message: 'ID utilisateur et rôle sont requis.' }, { status: 400 });
  }

  // Vérifie si le rôle est une valeur valide de l'enum UserRole
  const validRoles = ['ADMIN', 'USER']; // Assure-toi que ces valeurs correspondent à ton enum UserRole dans schema.prisma
  const upperCaseRole = role.toUpperCase();
  if (!validRoles.includes(upperCaseRole)) {
    return NextResponse.json({ success: false, message: 'Rôle invalide. Doit être "admin" ou "user".' }, { status: 400 });
  }

  try {
    // Utilise prisma.user.update pour mettre à jour le rôle
    const updatedUser = await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        role: upperCaseRole, // Utilise la valeur de l'enum
        // updatedAt est géré par @updatedAt dans le schéma Prisma
      },
    });

    // Si l'utilisateur n'est pas trouvé, Prisma lancera une erreur P2025
    return NextResponse.json({ success: true, message: 'Rôle utilisateur mis à jour.', user: updatedUser }, { status: 200 });
  } catch (error) {
    // Gérer l'erreur si l'utilisateur n'est pas trouvé (P2025)
    if (error.code === 'P2025') {
      return NextResponse.json({
        success: false,
        message: 'Utilisateur non trouvé ou rôle inchangé.',
      }, { status: 404 });
    }
    console.error("Erreur PUT utilisateur:", error);
    return NextResponse.json({
      success: false,
      message: `Erreur serveur lors de la mise à jour de l'utilisateur: ${error.message}`,
    }, { status: 500 });
  }
}

/**
 * Gère la requête DELETE pour supprimer un utilisateur (pour les administrateurs).
 * @param {Request} req - L'objet Request de Next.js.
 * @returns {Promise<NextResponse>}
 */
export async function DELETE(req) {
  const authResult = await authorizeAdmin();
  if (!authResult.authorized) return authResult.response;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ success: false, message: 'ID utilisateur est requis pour la suppression.' }, { status: 400 });
  }

  try {
    // Utilise prisma.user.delete pour supprimer l'utilisateur
    await prisma.user.delete({
      where: {
        id: id,
      },
    });
    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès.' }, { status: 200 });
  } catch (error) {
    // Gérer l'erreur si l'utilisateur n'est pas trouvé (P2025)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Utilisateur non trouvé.' }, { status: 404 });
    }
    // Gérer l'erreur de contrainte de clé étrangère (P2003)
    if (error.code === 'P2003') {
      return NextResponse.json({
        success: false,
        message: 'Impossible de supprimer l\'utilisateur car il est lié à des commandes ou d\'autres données. Veuillez supprimer les données liées d\'abord.',
      }, { status: 409 });
    }
    console.error("Erreur DELETE utilisateur:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  }
}