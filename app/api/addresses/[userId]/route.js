// ✅ app/api/addresses/[userId]/route.js — CORRIGÉ
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { v4 as uuidv4 } from 'uuid';

async function authorizeUser(req, context) {
  const session = await getServerSession(authOptions);
  const { userId: userIdFromParams } = context.params;

  if (!session) {
    console.warn(`Tentative d'accès non authentifiée à /api/addresses/${userIdFromParams}`);
    return { authorized: false, response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }) };
  }
  if (String(session.user.id) !== String(userIdFromParams)) {
    console.warn(`Tentative d'accès non autorisé à /api/addresses/${userIdFromParams} par userId ${session.user.id}`);
    return { authorized: false, response: NextResponse.json({ message: 'Non autorisé.' }, { status: 403 }) };
  }
  return { authorized: true, userId: userIdFromParams };
}

export async function GET(req, context) {
  const authResult = await authorizeUser(req, context);
  if (!authResult.authorized) return authResult.response;
  const userId = authResult.userId;

  let connection;
  try {
    connection = await pool.getConnection();
    const [addresses] = await connection.execute(
      `SELECT id, fullName, phoneNumber, pincode, area, city, state, isDefault FROM addresses WHERE userId = ? ORDER BY isDefault DESC, createdAt DESC`,
      [userId]
    );
    return NextResponse.json(addresses, { status: 200 });
  } catch (error) {
    console.error("Erreur GET adresses:", error);
    return NextResponse.json({ message: "Erreur serveur lors de la récupération des adresses.", error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(req, context) {
  const authResult = await authorizeUser(req, context);
  if (!authResult.authorized) return authResult.response;
  const userId = authResult.userId;
  const { fullName, phoneNumber, pincode, area, city, state, isDefault = false } = await req.json();

  if (!fullName || !phoneNumber || !area || !city || !state) {
    return NextResponse.json({ success: false, message: "Tous les champs d'adresse requis ne sont pas fournis." }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const newAddressId = uuidv4();
    await connection.execute(
      `INSERT INTO addresses (id, userId, fullName, phoneNumber, pincode, area, city, state, isDefault, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [newAddressId, userId, fullName, phoneNumber, pincode, area, city, state, isDefault]
    );
    return NextResponse.json({ success: true, message: "Adresse ajoutée avec succès.", id: newAddressId }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST adresse:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur lors de l'ajout de l'adresse: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(req, context) {
  const authResult = await authorizeUser(req, context);
  if (!authResult.authorized) return authResult.response;
  const userId = authResult.userId;

  const { id, fullName, phoneNumber, pincode, area, city, state, isDefault } = await req.json();
  if (!id || fullName === undefined || phoneNumber === undefined || area === undefined || city === undefined || state === undefined || isDefault === undefined) {
    return NextResponse.json({ success: false, message: "L'ID et tous les champs d'adresse sont requis pour la mise à jour." }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    if (isDefault) {
      await connection.execute(
        `UPDATE addresses SET isDefault = 0 WHERE userId = ? AND id != ?`,
        [userId, id]
      );
    }

    const [result] = await connection.execute(
      `UPDATE addresses SET fullName = ?, phoneNumber = ?, pincode = ?, area = ?, city = ?, state = ?, isDefault = ?, updatedAt = NOW() WHERE id = ? AND userId = ?`,
      [fullName, phoneNumber, pincode, area, city, state, isDefault, id, userId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return NextResponse.json({ success: false, message: "Adresse non trouvée ou non autorisée." }, { status: 404 });
    }

    await connection.commit();
    return NextResponse.json({ success: true, message: "Adresse mise à jour avec succès." }, { status: 200 });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Erreur PUT adresse:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(req, context) {
  const authResult = await authorizeUser(req, context);
  if (!authResult.authorized) return authResult.response;
  const userId = authResult.userId;
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ success: false, message: "L'ID de l'adresse est requis." }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute(
      `DELETE FROM addresses WHERE id = ? AND userId = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, message: "Adresse non trouvée ou non autorisée." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Adresse supprimée." }, { status: 200 });
  } catch (error) {
    console.error("Erreur DELETE adresse:", error);
    return NextResponse.json({ success: false, message: `Erreur serveur: ${error.message}` }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// ✅ app/api/admin/users/route.js — inchangé car déjà correct, compatible avec getServerSession(authOptions)
