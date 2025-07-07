import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

import { v4 as uuidv4 } from 'uuid';

// Fonction utilitaire d'autorisation
async function authorizeUser(req, context) {
  // ATTENTION : ici context.params peut être une Promise, on await !
  const { params } = await context;
  const userIdFromParams = params.userId;

  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }),
    };
  }

  if (session.user.id !== userIdFromParams) {
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Non autorisé.' }, { status: 403 }),
    };
  }

  return { authorized: true, userId: userIdFromParams };
}

// GET: Récupérer les articles du panier d'un utilisateur
export async function GET(req, context) {
  const authResult = await authorizeUser(req, context);
  if (!authResult.authorized) return authResult.response;
  const userId = authResult.userId;

  let connection;
  try {
    connection = await pool.getConnection();
    const [cartItems] = await connection.execute(
      `SELECT id, productId, quantity FROM cart_items WHERE userId = ?`,
      [userId]
    );
    return NextResponse.json(cartItems, { status: 200 });
  } catch (error) {
    console.error("Erreur GET panier:", error);
    return NextResponse.json({ message: "Erreur serveur lors de la récupération du panier.", error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// POST: Ajouter un article au panier
export async function POST(req, context) {
  const authResult = await authorizeUser(req, context);
  if (!authResult.authorized) return authResult.response;
  const userId = authResult.userId;

  const { productId, quantity = 1 } = await req.json();

  if (!productId) {
    return NextResponse.json({ success: false, message: "L'ID du produit est requis." }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [productExists] = await connection.execute(
      `SELECT id FROM products WHERE id = ?`,
      [productId]
    );

    if (productExists.length === 0) {
      return NextResponse.json({ success: false, message: "Le produit spécifié n'existe pas dans la base de données." }, { status: 404 });
    }

    const [existingItem] = await connection.execute(
      `SELECT id, quantity FROM cart_items WHERE userId = ? AND productId = ?`,
      [userId, productId]
    );

    if (existingItem.length > 0) {
      await connection.execute(
        `UPDATE cart_items SET quantity = quantity + ? WHERE userId = ? AND productId = ?`,
        [quantity, userId, productId]
      );
    } else {
      const newCartItemId = uuidv4();
      await connection.execute(
        `INSERT INTO cart_items (id, userId, productId, quantity) VALUES (?, ?, ?, ?)`,
        [newCartItemId, userId, productId, quantity]
      );
    }

    return NextResponse.json({ success: true, message: "Article ajouté au panier." }, { status: 200 });
  } catch (error) {
    console.error("Erreur POST panier:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ success: false, message: "Le produit est déjà dans le panier (erreur de doublon)." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: `Erreur serveur lors de l'ajout au panier: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// PUT: Mettre à jour la quantité
export async function PUT(req, context) {
  const authResult = await authorizeUser(req, context);
  if (!authResult.authorized) return authResult.response;
  const userId = authResult.userId;

  const { productId, quantity } = await req.json();

  if (!productId || quantity === undefined || quantity < 0) {
    return NextResponse.json({ success: false, message: "L'ID du produit et une quantité valide sont requis." }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    if (quantity <= 0) {
      const [result] = await connection.execute(
        `DELETE FROM cart_items WHERE userId = ? AND productId = ?`,
        [userId, productId]
      );
      if (result.affectedRows === 0) {
        return NextResponse.json({ success: false, message: "Article non trouvé dans le panier pour suppression ou utilisateur non autorisé." }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Article retiré du panier." }, { status: 200 });
    } else {
      const [result] = await connection.execute(
        `UPDATE cart_items SET quantity = ? WHERE userId = ? AND productId = ?`,
        [quantity, userId, productId]
      );
      if (result.affectedRows === 0) {
        const newCartItemId = uuidv4();
        await connection.execute(
          `INSERT INTO cart_items (id, userId, productId, quantity) VALUES (?, ?, ?, ?)`,
          [newCartItemId, userId, productId, quantity]
        );
        return NextResponse.json({ success: true, message: "Article ajouté/mis à jour dans le panier (via PUT)." }, { status: 200 });
      }
      return NextResponse.json({ success: true, message: "Quantité du panier mise à jour." }, { status: 200 });
    }
  } catch (error) {
    console.error("Erreur PUT panier:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur lors de la mise à jour du panier: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// DELETE: Supprimer un article spécifique du panier
export async function DELETE(req, context) {
  const authResult = await authorizeUser(req, context);
  if (!authResult.authorized) return authResult.response;
  const userId = authResult.userId;

  const { productId } = await req.json();

  if (!productId) {
    return NextResponse.json({ success: false, message: "L'ID du produit est requis pour la suppression." }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(
      `DELETE FROM cart_items WHERE userId = ? AND productId = ?`,
      [userId, productId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Article non trouvé dans le panier ou utilisateur non autorisé." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Article retiré du panier." }, { status: 200 });
  } catch (error) {
    console.error("Erreur DELETE panier:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur lors de la suppression du panier: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
