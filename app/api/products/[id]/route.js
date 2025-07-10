// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\products\[id]\route.js

import prisma from '../../../../lib/prisma'; // Assurez-toi que le chemin est correct vers ton client Prisma
import { NextResponse } from 'next/server';

console.log("--> API Route: app/api/products/[id]/route.js loaded"); // Log pour vérifier le chargement du fichier

/**
 * Gère la requête GET pour récupérer un produit par son ID.
 * @param {Request} req - L'objet Request de Next.js.
 * @param {object} params - Les paramètres dynamiques de l'URL (contenant l'ID).
 * @returns {Promise<NextResponse>}
 */
export async function GET(req, { params }) {
  // CORRECTION: 'params' doit être awaité pour accéder à ses propriétés
  const { id } = await params;
  console.log(`GET request received for product ID: ${id}`);

  if (!id) {
    return NextResponse.json({ success: false, message: 'L\'ID du produit est manquant.' }, { status: 400 });
  }

  try {
    // Utilise prisma.product.findUnique pour récupérer un produit par son ID
    const product = await prisma.product.findUnique({
      where: { id: id },
    });

    if (!product) {
      return NextResponse.json({ success: false, message: 'Produit non trouvé.' }, { status: 404 });
    }

    // Retourne le produit trouvé
    return NextResponse.json({ success: true, product: product }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la récupération du produit par ID:', error);
    return NextResponse.json({ success: false, message: `Erreur serveur lors de la récupération du produit: ${error.message}` }, { status: 500 });
  }
}

/**
 * Gère la requête PUT pour mettre à jour un produit par son ID.
 * @param {Request} req - L'objet Request de Next.js.
 * @param {object} params - Les paramètres dynamiques de l'URL (contenant l'ID).
 * @returns {Promise<NextResponse>}
 */
export async function PUT(req, { params }) {
  // CORRECTION: 'params' doit être awaité pour accéder à ses propriétés
  const { id } = await params;
  console.log(`PUT request received for product ID: ${id}`);

  const { name, description, price, offerPrice, stock, imgUrl, imageUrl, category, categoryId } = await req.json();

  if (!id) {
    return NextResponse.json({ success: false, message: 'L\'ID du produit est manquant.' }, { status: 400 });
  }

  // Utilisation de champs spécifiques basés sur les versions précédentes pour la robustesse
  const finalImgUrl = imgUrl || imageUrl; // Utilise 'imgUrl' si présent, sinon 'imageUrl'
  const finalCategory = category || categoryId; // Utilise 'category' si présent, sinon 'categoryId'

  // Validation basique des données
  if (!name || price === undefined || stock === undefined || !finalImgUrl) {
    return NextResponse.json({ success: false, message: 'Champs requis pour la mise à jour manquants (nom, prix, stock, URL image).' }, { status: 400 });
  }
  if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    return NextResponse.json({ message: 'Le prix doit être un nombre positif.' }, { status: 400 });
  }
  if (isNaN(parseInt(stock)) || parseInt(stock) < 0) {
    return NextResponse.json({ message: 'Le stock doit être un nombre positif ou zéro.' }, { status: 400 });
  }

  try {
    // Prisma gère la conversion des types si le schéma est correct.
    // offerPrice: Convertir en Decimal si nécessaire, ou null.
    // Assure-toi que le type dans schema.prisma est 'Decimal?' pour offerPrice.
    const finalOfferPrice = offerPrice !== null && offerPrice !== '' && parseFloat(offerPrice) > 0 ? parseFloat(offerPrice) : null;

    // Utilise prisma.product.update pour mettre à jour le produit
    const updatedProduct = await prisma.product.update({
      where: { id: id },
      data: {
        name: name,
        description: description || null,
        price: parseFloat(price), // Assure-toi que 'price' est un Float ou Decimal dans le schéma
        offerPrice: finalOfferPrice, // Doit être Decimal? dans le schéma
        stock: parseInt(stock),
        imgUrl: finalImgUrl,
        // *** IMPORTANT ***
        // Choisis une des options ci-dessous en fonction de ton schema.prisma :
        // Option 1: Si 'category' est juste une colonne 'String' ou 'Int' directement sur le modèle Product
        category: finalCategory || null, // Ou categoryId si c'est le nom exact du champ
        // Option 2: Si 'category' est une relation de clé étrangère avec un modèle 'Category'
        // category: finalCategory ? { connect: { id: finalCategory } } : undefined,
        // (Si tu utilises l'Option 2, assure-toi d'importer le modèle 'Category' si nécessaire ou d'adapter)

        // updatedAt est géré automatiquement par @updatedAt dans votre schéma Prisma si configuré
      },
    });

    // Si le produit n'est pas trouvé, Prisma lancera une erreur P2025
    return NextResponse.json({ success: true, message: 'Produit mis à jour avec succès.', product: updatedProduct }, { status: 200 });

  } catch (error) {
    // Gérer l'erreur si le produit n'est pas trouvé (P2025)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Produit non trouvé ou aucune modification effectuée.' }, { status: 404 });
    }
    console.error('Erreur lors de la mise à jour du produit:', error);
    return NextResponse.json({ success: false, message: `Erreur serveur lors de la mise à jour du produit: ${error.message}` }, { status: 500 });
  }
}

/**
 * Gère la requête DELETE pour supprimer un produit par son ID.
 * @param {Request} req - L'objet Request de Next.js.
 * @param {object} params - Les paramètres dynamiques de l'URL (contenant l'ID).
 * @returns {Promise<NextResponse>}
 */
export async function DELETE(req, { params }) {
  // CORRECTION: 'params' doit être awaité pour accéder à ses propriétés
  const { id } = await params;
  console.log(`DELETE request received for product ID: ${id}`);

  if (!id) {
    return NextResponse.json({ success: false, message: 'L\'ID du produit est manquant.' }, { status: 400 });
  }

  try {
    // Utilise prisma.product.delete pour supprimer le produit
    await prisma.product.delete({
      where: { id: id },
    });

    return NextResponse.json({ success: true, message: 'Produit supprimé avec succès.' }, { status: 200 });

  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    // Gérer l'erreur si le produit n'est pas trouvé (P2025)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Produit non trouvé.' }, { status: 404 });
    }
    // Gérer l'erreur de contrainte de clé étrangère (P2003)
    if (error.code === 'P2003') {
      return NextResponse.json({
        success: false,
        message: 'Impossible de supprimer le produit car il est lié à d\'autres enregistrements (ex: articles de panier, articles de commande). Veuillez le retirer de ces enregistrements d\'abord ou configurer ON DELETE CASCADE.',
      }, { status: 409 }); // 409 Conflit
    }
    return NextResponse.json({ success: false, message: `Erreur serveur lors de la suppression: ${error.message}` }, { status: 500 });
  }
}