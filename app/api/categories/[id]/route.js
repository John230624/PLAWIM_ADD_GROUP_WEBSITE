// app/api/categories/[id]/route.js
import { NextResponse } from 'next/server';
import pool from '../../../../lib/db'; // Vérifie bien le chemin

export async function GET(req, { params }) {
  const { id } = params; // Récupère l'ID de l'URL via params (spécifique App Router)
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM categories WHERE id = ?', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ message: 'Catégorie non trouvée.' }, { status: 404 });
    }
    return NextResponse.json(rows[0], { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(req, { params }) {
  const { id } = params;
  let connection;
  try {
    const { name, description, imageUrl } = await req.json();

    if (!name) {
      return NextResponse.json({ message: 'Le nom de la catégorie est requis pour la mise à jour.' }, { status: 400 });
    }

    connection = await pool.getConnection();
    const [result] = await connection.execute(
      'UPDATE categories SET name = ?, description = ?, imageUrl = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description || null, imageUrl || null, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Catégorie non trouvée ou aucune modification effectuée.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Catégorie mise à jour avec succès.' }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

export async function DELETE(req, { params }) {
  const { id } = params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute('DELETE FROM categories WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ message: 'Catégorie non trouvée ou déjà supprimée.' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Catégorie supprimée avec succès.' }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}