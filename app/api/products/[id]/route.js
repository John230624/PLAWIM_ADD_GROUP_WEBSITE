// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\products\[id]\route.js

import prisma from '../../../../lib/prisma'; 
import { NextResponse } from 'next/server';

console.log("--> API Route: app/api/products/[id]/route.js loaded");

export async function GET(req, context) {
  const { id } = await context.params;
  console.log(`GET request received for product ID: ${id}`);

  if (!id) {
    return NextResponse.json({ success: false, message: 'L\'ID du produit est manquant.' }, { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Produit non trouvé.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération du produit par ID:', error);
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(req, context) {
  const { id } = await context.params;
  console.log(`PUT request received for product ID: ${id}`);

  const { name, description, price, offerPrice, stock, imgUrl, imageUrl, category, categoryId } = await req.json();

  if (!id) {
    return NextResponse.json({ success: false, message: 'L\'ID du produit est manquant.' }, { status: 400 });
  }

  const finalImgUrl = imgUrl || imageUrl;
  const finalCategory = category || categoryId;

  if (!name || price === undefined || stock === undefined || !finalImgUrl) {
    return NextResponse.json({ success: false, message: 'Champs requis manquants (nom, prix, stock, image).' }, { status: 400 });
  }
  if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    return NextResponse.json({ message: 'Le prix doit être un nombre positif.' }, { status: 400 });
  }
  if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
    return NextResponse.json({ message: 'Le stock doit être un nombre positif ou zéro.' }, { status: 400 });
  }

  try {
    const finalOfferPrice = offerPrice !== null && offerPrice !== '' && parseFloat(offerPrice) > 0 ? parseFloat(offerPrice) : null;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        offerPrice: finalOfferPrice,
        stock: parseInt(stock),
        imgUrl: finalImgUrl,
        category: finalCategory || null,
      },
    });

    return NextResponse.json({ success: true, message: 'Produit mis à jour.', product: updatedProduct }, { status: 200 });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Produit non trouvé ou aucune modification.' }, { status: 404 });
    }
    console.error('Erreur mise à jour produit:', error);
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  const { id } = await context.params;
  console.log(`DELETE request received for product ID: ${id}`);

  if (!id) {
    return NextResponse.json({ success: false, message: 'L\'ID du produit est manquant.' }, { status: 400 });
  }

  try {
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Produit supprimé.' }, { status: 200 });
  } catch (error) {
    console.error('Erreur suppression produit:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Produit non trouvé.' }, { status: 404 });
    }
    if (error.code === 'P2003') {
      return NextResponse.json({
        success: false,
        message: 'Impossible de supprimer le produit lié à d\'autres données. Supprimez-les d\'abord ou configurez ON DELETE CASCADE.',
      }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  }
}
