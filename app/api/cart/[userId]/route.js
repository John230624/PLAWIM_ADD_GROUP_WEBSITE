// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\cart\[userId]\route.js

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

console.log("--> API Route: app/api/cart/[userId]/route.js loaded");

// Fonction utilitaire pour gérer les erreurs Prisma
function handlePrismaError(error) {
  if (error.code === 'P2025') {
    return NextResponse.json({ message: 'Ressource non trouvée.' }, { status: 404 });
  }
  // Gérer d'autres codes d'erreur Prisma spécifiques si nécessaire
  console.error('Erreur Prisma:', error);
  return NextResponse.json({ message: `Erreur base de données: ${error.message}` }, { status: 500 });
}

// Fonction utilitaire pour autoriser l'utilisateur
async function authorizeUser(userIdFromParams) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || String(session.user.id) !== String(userIdFromParams)) {
    console.warn(`Tentative d'accès non autorisé au panier de l'utilisateur ${userIdFromParams}.`);
    return { authorized: false, response: NextResponse.json({ message: 'Non autorisé.' }, { status: 403 }) };
  }
  return { authorized: true, session };
}

/**
 * Gère la requête GET pour récupérer le contenu du panier d'un utilisateur.
 * GET /api/cart/[userId]
 */
export async function GET(req, context) {
  const params = await context.params;
  const userId = params.userId;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imgUrl: true, // Inclut imgUrl
            stock: true,
          },
        },
      },
    });

    const formattedCartItems = cartItems.map(item => {
      let productImgUrl = '/placeholder-product.png'; // Valeur par défaut

      // Simplification de la logique d'image: s'attend à une simple chaîne
      if (item.product?.imgUrl && typeof item.product.imgUrl === 'string' && item.product.imgUrl.trim() !== '') {
        productImgUrl = item.product.imgUrl;
      }

      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        productName: item.product?.name,
        productPrice: item.product?.price,
        productImgUrl: productImgUrl, // Utilise l'URL traitée
        productStock: item.product?.stock,
      };
    });

    return NextResponse.json(formattedCartItems, { status: 200 });
  } catch (error) {
    console.error("Erreur GET panier:", error);
    return handlePrismaError(error);
  }
}

/**
 * Gère la requête POST pour ajouter ou mettre à jour un article dans le panier.
 * POST /api/cart/[userId]
 * Body: { productId: string, quantity?: number }
 */
export async function POST(req, context) {
  const params = await context.params;
  const userId = params.userId;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  const { productId, quantity = 1 } = await req.json();

  if (!productId || quantity < 1) {
    return NextResponse.json({ success: false, message: "L'ID du produit et une quantité valide sont requis." }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: "Le produit spécifié n'existe pas." }, { status: 404 });
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        // CORRECTION: Utilise le nom de la clé composée définie dans schema.prisma
        user_product_unique: {
          userId: userId,
          productId: productId,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        userId: userId,
        productId: productId,
        quantity: quantity,
      },
    });

    return NextResponse.json({ success: true, message: "Article ajouté/mis à jour dans le panier.", cartItem }, { status: 200 });
  } catch (error) {
    console.error("Erreur POST panier:", error);
    return handlePrismaError(error);
  }
}

/**
 * Gère la requête PUT pour mettre à jour la quantité d'un article dans le panier.
 * PUT /api/cart/[userId]
 * Body: { productId: string, quantity: number }
 */
export async function PUT(req, context) {
  const params = await context.params;
  const userId = params.userId;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  const { productId, quantity } = await req.json();

  if (!productId || quantity === undefined || quantity < 0) {
    return NextResponse.json({ success: false, message: "Produit ou quantité invalide." }, { status: 400 });
  }

  try {
    if (quantity <= 0) {
      // Supprimer l'article si la quantité est 0
      const deletedItem = await prisma.cartItem.delete({
        where: {
          user_product_unique: { // Utilise la clé composée
            userId: userId,
            productId: productId,
          },
        },
      });
      return NextResponse.json({ success: true, message: "Article retiré du panier (quantité à zéro).", deletedItem }, { status: 200 });
    } else {
      // Mettre à jour la quantité
      const updatedItem = await prisma.cartItem.update({
        where: {
          user_product_unique: { // Utilise la clé composée
            userId: userId,
            productId: productId,
          },
        },
        data: {
          quantity: quantity,
        },
      });
      return NextResponse.json({ success: true, message: "Quantité mise à jour.", updatedItem }, { status: 200 });
    }
  } catch (error) {
    console.error("Erreur PUT panier:", error);
    return handlePrismaError(error);
  }
}

/**
 * Gère la requête DELETE pour supprimer un article du panier ou vider le panier entier.
 * DELETE /api/cart/[userId]?productId=[productId] (pour supprimer un article spécifique)
 * DELETE /api/cart/[userId] (pour vider le panier)
 */
export async function DELETE(req, context) {
  const params = await context.params;
  const userId = params.userId;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  const { searchParams } = new URL(req.url); // Utilise req.url pour obtenir les searchParams
  const productId = searchParams.get('productId');

  if (!userId) {
    return NextResponse.json({ success: false, message: "ID utilisateur manquant." }, { status: 400 });
  }

  try {
    if (productId) {
      // Supprimer un article spécifique du panier
      const deletedItem = await prisma.cartItem.delete({
        where: {
          user_product_unique: { // Utilise la clé composée
            userId: userId,
            productId: productId,
          },
        },
      });
      return NextResponse.json({ success: true, message: "Article supprimé du panier.", deletedItem }, { status: 200 });
    } else {
      // Vider tout le panier de l'utilisateur
      const deletedItems = await prisma.cartItem.deleteMany({
        where: { userId: userId },
      });
      return NextResponse.json({ success: true, message: `Panier vidé avec succès. ${deletedItems.count} articles supprimés.` }, { status: 200 });
    }
  } catch (error) {
    console.error("Erreur DELETE panier:", error);
    return handlePrismaError(error);
  }
}