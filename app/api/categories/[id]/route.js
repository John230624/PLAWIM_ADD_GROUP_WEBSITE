// app/api/categories/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma'; // Assure-toi que le chemin est correct et que c'est bien 'prisma'

/**
 * Gère la requête GET pour récupérer une catégorie par son ID.
 * @param {Request} req - L'objet Request de Next.js.
 * @param {object} context - Le contexte de la requête, contenant les paramètres (params).
 * @returns {Promise<NextResponse>}
 */
export async function GET(req, { params }) {
  const { id } = params; // Récupère l'ID de l'URL via params (spécifique App Router)

  try {
    // Utilise prisma.category.findUnique pour récupérer une catégorie par son ID
    const category = await prisma.category.findUnique({
      where: { id: id }, // Assurez-vous que l'ID dans votre schéma est de type String ou int
    });

    if (!category) {
      return NextResponse.json({ message: 'Catégorie non trouvée.' }, { status: 404 });
    }
    return NextResponse.json(category, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
  }
}

/**
 * Gère la requête PUT pour mettre à jour une catégorie par son ID.
 * @param {Request} req - L'objet Request de Next.js.
 * @param {object} context - Le contexte de la requête, contenant les paramètres (params).
 * @returns {Promise<NextResponse>}
 */
export async function PUT(req, { params }) {
  const { id } = params;

  try {
    const { name, description, imageUrl } = await req.json();

    if (!name) {
      return NextResponse.json({ message: 'Le nom de la catégorie est requis pour la mise à jour.' }, { status: 400 });
    }

    // Utilise prisma.category.update pour mettre à jour la catégorie
    const updatedCategory = await prisma.category.update({
      where: { id: id },
      data: {
        name: name,
        description: description, // Prisma gère null si la valeur est null/undefined
        imageUrl: imageUrl,       // Prisma gère null si la valeur est null/undefined
        // updatedAt est géré automatiquement par @updatedAt dans votre schéma Prisma
      },
    });

    // Si la catégorie n'est pas trouvée, Prisma lancera une erreur P2025
    return NextResponse.json({ message: 'Catégorie mise à jour avec succès.', category: updatedCategory }, { status: 200 });
  } catch (error) {
    // Gérer l'erreur si la catégorie n'est pas trouvée (P2025)
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Catégorie non trouvée ou aucune modification effectuée.' }, { status: 404 });
    }
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
  }
}

/**
 * Gère la requête DELETE pour supprimer une catégorie par son ID.
 * @param {Request} req - L'objet Request de Next.js.
 * @param {object} context - Le contexte de la requête, contenant les paramètres (params).
 * @returns {Promise<NextResponse>}
 */
export async function DELETE(req, { params }) {
  const { id } = params;

  try {
    // Utilise prisma.category.delete pour supprimer la catégorie
    await prisma.category.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Catégorie supprimée avec succès.' }, { status: 200 });
  } catch (error) {
    // Gérer l'erreur si la catégorie n'est pas trouvée (P2025)
    if (error.code === 'P2025') {
      return NextResponse.json({ message: 'Catégorie non trouvée ou déjà supprimée.' }, { status: 404 });
    }
    // Gérer l'erreur de contrainte de clé étrangère (P2003) si des produits sont liés à cette catégorie
    if (error.code === 'P2003') {
      return NextResponse.json({
        message: 'Impossible de supprimer cette catégorie car des produits y sont liés. Supprimez les produits liés d\'abord.',
      }, { status: 409 }); // Conflit
    }
    console.error('Erreur lors de la suppression de la catégorie:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
  }
}