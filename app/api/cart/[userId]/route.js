import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'; // Correct pour l'App Router
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

async function authorizeUser(userIdFromParams) {
  // Simplification : pas besoin de headers/cookies pour getServerSession dans les Route Handlers
  const session = await getServerSession(authOptions);

  if (!session || !session.user || String(session.user.id) !== String(userIdFromParams)) {
    console.warn(`Tentative d'accès non autorisé au panier de l'utilisateur ${userIdFromParams}.`);
    return { authorized: false, response: NextResponse.json({ message: 'Non autorisé.' }, { status: 403 }) };
  }
  return { authorized: true, session };
}

export async function GET(req, context) {
  // Accès direct à userId via context.params
  const { userId } = context.params;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response; // Utilise le response retourné par authorizeUser

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            imgUrl: true,
            stock: true,
          },
        },
      },
    });

    const formattedCartItems = cartItems.map(item => {
      let itemImgUrl = [];
      if (item.product?.imgUrl) {
        try {
          const parsed = JSON.parse(item.product.imgUrl);
          if (Array.isArray(parsed)) itemImgUrl = parsed;
          else if (typeof parsed === 'string') itemImgUrl = [parsed];
        } catch {
          // Fallback si JSON.parse échoue, et si c'est une chaîne d'URL valide
          if (typeof item.product.imgUrl === 'string' && (item.product.imgUrl.startsWith('/') || item.product.imgUrl.startsWith('http'))) {
            itemImgUrl = [item.product.imgUrl];
          }
        }
      }
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        productName: item.product?.name,
        productPrice: item.product?.price,
        productImgUrl: itemImgUrl.length > 0 ? itemImgUrl[0] : '/placeholder-product.png',
        productStock: item.product?.stock,
      };
    });

    return NextResponse.json(formattedCartItems, { status: 200 });
  } catch (error) {
    console.error("Erreur GET panier:", error);
    return NextResponse.json({ message: "Erreur serveur lors de la récupération du panier.", error: error.message }, { status: 500 });
  }
}

export async function POST(req, context) {
  // Accès direct à userId via context.params
  const { userId } = context.params;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response; // Utilise le response retourné par authorizeUser

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
        user_product_unique: { // Correction ici : utiliser le nom exact de l'unique constraint
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

    return NextResponse.json({ success: true, message: "Article ajouté au panier.", cartItem }, { status: 200 });
  } catch (error) {
    console.error("Erreur POST panier:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(req, context) {
  // Accès direct à userId via context.params
  const { userId } = context.params;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response; // Utilise le response retourné par authorizeUser

  const { productId, quantity } = await req.json();

  if (!productId || quantity === undefined || quantity < 0) {
    return NextResponse.json({ success: false, message: "Produit ou quantité invalide." }, { status: 400 });
  }

  try {
    if (quantity <= 0) {
      const deletedItem = await prisma.cartItem.deleteMany({
        where: {
          userId: userId,
          productId: productId,
        },
      });

      if (deletedItem.count === 0) {
        return NextResponse.json({ success: false, message: "Article non trouvé dans le panier." }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Article retiré du panier." }, { status: 200 });
    } else {
      const updatedItem = await prisma.cartItem.updateMany({
        where: {
          userId: userId,
          productId: productId,
        },
        data: {
          quantity: quantity,
        },
      });

      if (updatedItem.count === 0) {
        // Si l'élément n'existait pas pour la mise à jour, le créer
        const newCartItem = await prisma.cartItem.create({
          data: {
            userId: userId,
            productId: productId,
            quantity: quantity,
          },
        });
        return NextResponse.json({ success: true, message: "Article ajouté dans le panier.", cartItem: newCartItem }, { status: 200 });
      }
      return NextResponse.json({ success: true, message: "Quantité mise à jour." }, { status: 200 });
    }
  } catch (error) {
    console.error("Erreur PUT panier:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  // Accès direct à userId via context.params
  const { userId } = context.params;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response; // Utilise le response retourné par authorizeUser

  const { productId } = await req.json();

  if (!productId) {
    return NextResponse.json({ success: false, message: "Produit manquant pour suppression." }, { status: 400 });
  }

  try {
    const deletedItem = await prisma.cartItem.deleteMany({
      where: {
        userId: userId,
        productId: productId,
      },
    });

    if (deletedItem.count === 0) {
      return NextResponse.json({ success: false, message: "Article non trouvé dans le panier." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Article supprimé." }, { status: 200 });
  } catch (error) {
    console.error("Erreur DELETE panier:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  }
}