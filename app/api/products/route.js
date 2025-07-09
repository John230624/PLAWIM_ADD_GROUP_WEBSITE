// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\products\route.js

import prisma from '../../../lib/prisma';
import { NextResponse } from 'next/server';

console.log("--> API Route: app/api/products/route.js loaded");

export async function GET(request) {
  console.log("GET request received for all products.");

  try {
    const products = await prisma.product.findMany();
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("Erreur dans l'API GET tous les produits:", error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur.', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  console.log("POST request received to create a new product.");

  try {
    const {
      name,
      description,
      price,
      imgUrl,
      stock,
      category,
      offerPrice,
    } = await request.json();

    // ✅ Validation des données
    if (!name || price === undefined) {
      return NextResponse.json(
        { message: 'Le nom et le prix sont requis.' },
        { status: 400 }
      );
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return NextResponse.json(
        { message: 'Le prix doit être un nombre positif.' },
        { status: 400 }
      );
    }
    if (
      stock !== undefined &&
      (isNaN(parseInt(stock)) || parseInt(stock) < 0)
    ) {
      return NextResponse.json(
        { message: 'Le stock doit être un nombre positif ou zéro.' },
        { status: 400 }
      );
    }

    // ✅ Création du produit
    const newProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        offerPrice: offerPrice ? parseFloat(offerPrice) : null,
        imgUrl: imgUrl || null,
        stock: parseInt(stock) || 0,
        category: category || "Général",
      },
    });

    return NextResponse.json(
      { message: 'Produit créé avec succès', product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur dans l'API POST produit:", error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur.', error: error.message },
      { status: 500 }
    );
  }
}
