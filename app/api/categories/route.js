// app/api/categories/route.js
import { NextResponse } from 'next/server';
import pool from '../../../lib/db'; // chemin corrigé

export async function GET(req) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute('SELECT * FROM categories');
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur.', error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(req) {
  let connection;
  try {
    const { name, description, imageUrl } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Le nom de la catégorie est requis.' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Vérifier si la catégorie existe déjà
    const [existingCategories] = await connection.execute(
      'SELECT id FROM categories WHERE name = ?',
      [name]
    );
    if (existingCategories.length > 0) {
      return NextResponse.json(
        { message: 'Cette catégorie existe déjà.' },
        { status: 409 }
      );
    }

    const [result] = await connection.execute(
      'INSERT INTO categories (name, description, imageUrl) VALUES (?, ?, ?)',
      [name, description || null, imageUrl || null]
    );

    return NextResponse.json(
      { message: 'Catégorie créée avec succès !', categoryId: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création de la catégorie:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur.', error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
