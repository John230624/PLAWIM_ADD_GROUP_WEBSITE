// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\categories\route.js
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Assure-toi que le chemin est correct.

/**
 * Gère la requête GET pour récupérer toutes les catégories.
 * @param {Request} req - L'objet Request de Next.js.
 * @returns {Promise<NextResponse>}
 */
export async function GET(req) {
  try {
    // Utilise prisma.category.findMany pour récupérer toutes les catégories
    const categories = await prisma.category.findMany();
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur.', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Gère la requête POST pour créer une nouvelle catégorie.
 * @param {Request} req - L'objet Request de Next.js.
 * @returns {Promise<NextResponse>}
 */
export async function POST(req) {
  try {
    const { name, description, imageUrl } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Le nom de la catégorie est requis.' },
        { status: 400 }
      );
    }

    // Vérifier si la catégorie existe déjà par son nom
    const existingCategory = await prisma.category.findUnique({
      where: { name: name }, // Assurez-vous que le champ 'name' est unique dans votre schema.prisma
    });

    if (existingCategory) {
      return NextResponse.json(
        { message: 'Cette catégorie existe déjà.' },
        { status: 409 }
      );
    }

    // Crée la nouvelle catégorie en utilisant prisma.category.create
    const newCategory = await prisma.category.create({
      data: {
        name: name,
        description: description, // Prisma gère null si la valeur est null/undefined
        imageUrl: imageUrl,       // Prisma gère null si la valeur est null/undefined
        // createdAt et updatedAt sont gérés automatiquement par Prisma si @default(now()) et @updatedAt sont définis dans le schéma
      },
    });

    return NextResponse.json(
      { message: 'Catégorie créée avec succès !', categoryId: newCategory.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    // Gérer l'erreur P2002 (violation de contrainte unique) si le nom est défini comme unique dans le schéma
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return NextResponse.json(
        { message: 'Une catégorie avec ce nom existe déjà.' },
        { status: 409 } // Conflit
      );
    }
    return NextResponse.json(
      { message: 'Erreur interne du serveur.', error: error.message },
      { status: 500 }
    );
  }
}