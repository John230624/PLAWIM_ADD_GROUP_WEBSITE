import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeUser } from '@/lib/authorizeUser';

export async function GET(req, context) {
  const { params } = context;
  const { userId } = params;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: { id: true, name: true, price: true, imgUrl: true, stock: true },
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
          if (
            typeof item.product.imgUrl === 'string' &&
            (item.product.imgUrl.startsWith('/') || item.product.imgUrl.startsWith('http'))
          ) {
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

    return NextResponse.json(formattedCartItems);
  } catch (error) {
    console.error("Erreur GET panier:", error);
    return NextResponse.json(
      { message: "Erreur serveur lors de la récupération du panier.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req, context) {
  const { params } = context;
  const { userId } = params;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  const { productId, quantity = 1 } = await req.json();
  if (!productId || quantity < 1) {
    return NextResponse.json(
      { success: false, message: "L'ID du produit et une quantité valide sont requis." },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Le produit spécifié n'existe pas." },
        { status: 404 }
      );
    }

    const cartItem = await prisma.cartItem.upsert({
      where: { user_product_unique: { userId, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId, productId, quantity },
    });

    return NextResponse.json({ success: true, message: "Article ajouté au panier.", cartItem });
  } catch (error) {
    console.error("Erreur POST panier:", error);
    return NextResponse.json(
      { success: false, message: `Erreur serveur: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  const { params } = context;
  const { userId } = params;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  const { productId, quantity } = await req.json();
  if (!productId || quantity === undefined || quantity < 0) {
    return NextResponse.json(
      { success: false, message: "Produit ou quantité invalide." },
      { status: 400 }
    );
  }

  try {
    if (quantity <= 0) {
      const deletedItem = await prisma.cartItem.deleteMany({ where: { userId, productId } });
      if (deletedItem.count === 0) {
        return NextResponse.json(
          { success: false, message: "Article non trouvé dans le panier." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message: "Article retiré du panier." });
    } else {
      const updatedItem = await prisma.cartItem.updateMany({
        where: { userId, productId },
        data: { quantity },
      });

      if (updatedItem.count === 0) {
        const newCartItem = await prisma.cartItem.create({ data: { userId, productId, quantity } });
        return NextResponse.json({ success: true, message: "Article ajouté dans le panier.", cartItem: newCartItem });
      }
      return NextResponse.json({ success: true, message: "Quantité mise à jour." });
    }
  } catch (error) {
    console.error("Erreur PUT panier:", error);
    return NextResponse.json(
      { success: false, message: `Erreur serveur: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  const { params } = context;
  const { userId } = params;

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  const { productId } = await req.json();
  if (!productId) {
    return NextResponse.json(
      { success: false, message: "Produit manquant pour suppression." },
      { status: 400 }
    );
  }

  try {
    const deletedItem = await prisma.cartItem.deleteMany({ where: { userId, productId } });
    if (deletedItem.count === 0) {
      return NextResponse.json(
        { success: false, message: "Article non trouvé dans le panier." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Article supprimé." });
  } catch (error) {
    console.error("Erreur DELETE panier:", error);
    return NextResponse.json(
      { success: false, message: `Erreur serveur: ${error.message}` },
      { status: 500 }
    );
  }
}
