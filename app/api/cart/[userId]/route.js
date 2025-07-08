import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { headers, cookies } from 'next/headers';

async function authorizeUser(userIdFromParams) {
  const session = await getServerSession(authOptions, {
    headers: headers(),
    cookies: cookies(),
  });

  if (!session || !session.user || String(session.user.id) !== String(userIdFromParams)) {
    return { authorized: false };
  }
  return { authorized: true };
}

export async function GET(req, context) {
  const userId = context.params.userId;
  const authResult = await authorizeUser(userId);
  if (!authResult.authorized)
    return NextResponse.json({ message: 'Non autorisé.' }, { status: 403 });

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

export async function POST(req, context) {
  const userId = context.params.userId;
  const authResult = await authorizeUser(userId);
  if (!authResult.authorized)
    return NextResponse.json({ message: 'Non autorisé.' }, { status: 403 });

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
      return NextResponse.json({ success: false, message: "Le produit spécifié n'existe pas." }, { status: 404 });
    }

    const [existingItem] = await connection.execute(
      `SELECT id FROM cart_items WHERE userId = ? AND productId = ?`,
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
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(req, context) {
  const userId = context.params.userId;
  const authResult = await authorizeUser(userId);
  if (!authResult.authorized)
    return NextResponse.json({ message: 'Non autorisé.' }, { status: 403 });

  const { productId, quantity } = await req.json();

  if (!productId || quantity === undefined || quantity < 0) {
    return NextResponse.json({ success: false, message: "Produit ou quantité invalide." }, { status: 400 });
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
        return NextResponse.json({ success: false, message: "Article non trouvé dans le panier." }, { status: 404 });
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
        return NextResponse.json({ success: true, message: "Article ajouté dans le panier." }, { status: 200 });
      }
      return NextResponse.json({ success: true, message: "Quantité mise à jour." }, { status: 200 });
    }
  } catch (error) {
    console.error("Erreur PUT panier:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(req, context) {
  const userId = context.params.userId;
  const authResult = await authorizeUser(userId);
  if (!authResult.authorized)
    return NextResponse.json({ message: 'Non autorisé.' }, { status: 403 });

  const { productId } = await req.json();

  if (!productId) {
    return NextResponse.json({ success: false, message: "Produit manquant pour suppression." }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(
      `DELETE FROM cart_items WHERE userId = ? AND productId = ?`,
      [userId, productId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Article non trouvé dans le panier." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Article supprimé." }, { status: 200 });
  } catch (error) {
    console.error("Erreur DELETE panier:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
