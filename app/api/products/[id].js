// app/api/products/[id]/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db'; // Utilisation de l'alias '@/lib/db'

console.log("--> API Route: app/api/products/[id]/route.js loaded"); // Log pour vérifier le chargement du fichier

export async function GET(request, { params }) {
    const { id } = params;
    let connection;
    console.log(`GET request received for product ID: ${id}`); // Log pour vérifier l'ID reçu

    try {
        connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM products WHERE id = ?', [id]);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Produit non trouvé.' }, { status: 404 });
        }
        return NextResponse.json(rows[0], { status: 200 });
    } catch (error) {
        console.error('Erreur dans l\'API GET produit ID:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

export async function PUT(request, { params }) {
    const { id } = params;
    let connection;
    console.log(`PUT request received for product ID: ${id}`); // Log pour vérifier l'ID reçu

    try {
        const { name, description, price, imageUrl, stock, categoryId } = await request.json();

        // Validation basique des données
        if (!name || !price) {
            return NextResponse.json({ message: 'Le nom et le prix sont requis pour la mise à jour.' }, { status: 400 });
        }
        if (isNaN(price) || price <= 0) {
            return NextResponse.json({ message: 'Le prix doit être un nombre positif.' }, { status: 400 });
        }
        if (stock !== undefined && (isNaN(stock) || stock < 0)) {
            return NextResponse.json({ message: 'Le stock doit être un nombre positif ou zéro.' }, { status: 400 });
        }

        connection = await pool.getConnection();
        const [result] = await connection.execute(
            'UPDATE products SET name = ?, description = ?, price = ?, imageUrl = ?, stock = ?, categoryId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [name, description || null, parseFloat(price), imageUrl || null, parseInt(stock) || 0, categoryId || null, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Produit non trouvé ou aucune modification effectuée.' }, { status: 404 });
        }
        return NextResponse.json({ message: 'Produit mis à jour avec succès.' }, { status: 200 });
    } catch (error) {
        console.error('Erreur dans l\'API PUT produit ID:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

export async function DELETE(request, { params }) {
    const { id } = params;
    let connection;
    console.log(`DELETE request received for product ID: ${id}`); // Log pour vérifier l'ID reçu et le bon appel de la fonction

    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute('DELETE FROM products WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Produit non trouvé ou déjà supprimé.' }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: 'Produit supprimé avec succès.' }, { status: 200 });
    } catch (error) {
        console.error('Erreur dans l\'API DELETE produit ID:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}