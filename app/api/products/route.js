import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';

export async function POST(req) {
    let connection;
    try {
        const { name, description, category, price, offerPrice, stock, imgUrl } = await req.json();

        // Validation
        if (!name || !description || !category || !price || !imgUrl || stock === undefined) {
            return NextResponse.json(
                { message: 'Tous les champs obligatoires sont requis' },
                { status: 400 }
            );
        }

        connection = await pool.getConnection();
        const productId = uuidv4(); // Génère un nouvel UUID pour le produit

        const [result] = await connection.execute(
            `INSERT INTO products (id, name, description, category, price, offerPrice, stock, imgUrl)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [productId, name, description, category, price, offerPrice, stock, imgUrl]
        );

        return NextResponse.json(
            { message: 'Produit ajouté', productId },
            { status: 201 }
        );
    } catch (error) {
        console.error('Erreur:', error);
        return NextResponse.json(
            { message: 'Erreur serveur', error: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}

export async function GET() {
    let connection;
    try {
        connection = await pool.getConnection();
        const [products] = await connection.execute('SELECT * FROM products'); // Récupère TOUS les produits
        return NextResponse.json(products); // Renvoie les produits sous forme de tableau JSON
    } catch (error) {
        console.error('Erreur:', error);
        return NextResponse.json(
            { message: 'Erreur serveur', error: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) connection.release();
    }
}
