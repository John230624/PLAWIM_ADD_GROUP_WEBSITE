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
    console.error('Erreur dans l\'API GET tous les produits:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  console.log("POST request received to create a new product.");

  try {
    const { name, description, price, imageUrl, stock, categoryId } = await request.json();

    // --- NOUVELLE LOGIQUE POUR GÉRER imageUrl REÇUE ---
    let finalImageUrl = null;
    if (Array.isArray(imageUrl) && imageUrl.length > 0) {
      finalImageUrl = imageUrl[0]; // Prend le premier élément si c'est un tableau non vide
    } else if (typeof imageUrl === 'string' && imageUrl !== '') {
      finalImageUrl = imageUrl; // Utilise la chaîne directement si elle n'est pas vide
    }
    // Si imageUrl est vide, null, undefined ou un tableau vide, finalImageUrl restera null.

    console.log("Image URL received (raw from client):", imageUrl);
    console.log("Image URL to be saved (finalImageUrl):", finalImageUrl);
    // --- FIN NOUVELLE LOGIQUE ---

    if (!name || price === undefined || !finalImageUrl) { // Ajout de finalImageUrl à la validation
      return NextResponse.json({ message: 'Le nom, le prix et l\'URL de l\'image sont requis.' }, { status: 400 });
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return NextResponse.json({ message: 'Le prix doit être un nombre positif.' }, { status: 400 });
    }
    if (stock !== undefined && (isNaN(parseInt(stock)) || parseInt(stock) < 0)) {
      return NextResponse.json({ message: 'Le stock doit être un nombre positif ou zéro.' }, { status: 400 });
    }

    // Préparer les données pour Prisma
    const productData = {
      name: name,
      description: description || null,
      price: parseFloat(price),
      imgUrl: finalImageUrl, // Utilisez la valeur traitée ici
      stock: parseInt(stock) || 0,
      // La logique pour categoryId est correcte si vous voulez le comportement de @default("Général")
    };

    if (categoryId) {
      productData.category = categoryId;
    }

    const newProduct = await prisma.product.create({
      data: productData,
    });

    return NextResponse.json({ message: 'Produit créé avec succès', product: newProduct }, { status: 201 });
  } catch (error) {
    console.error('Erreur dans l\'API POST produit:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
  }
}