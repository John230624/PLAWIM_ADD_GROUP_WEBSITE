// app/api/admin/users/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
// CORRECTION DU CHEMIN D'IMPORTATION
import { authOptions } from '@/lib/authOptions';

import pool from '../../../../lib/db'; // Assurez-vous que le chemin est correct

// Fonction utilitaire d'autorisation pour les admins
async function authorizeAdmin() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        console.warn("Accès non authentifié à l'API admin/users.");
        return { authorized: false, response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }) };
    }

    if (session.user.role?.toLowerCase() !== 'admin') {
        console.warn(`Accès non autorisé à l'API admin/users par l'utilisateur ${session.user.id} (Rôle: ${session.user.role || 'Aucun'})`);
        return { authorized: false, response: NextResponse.json({ message: 'Accès interdit. Seuls les administrateurs peuvent gérer les utilisateurs.' }, { status: 403 }) };
    }
    return { authorized: true };
}

// GET: Récupérer tous les utilisateurs
export async function GET(req) {
    const authResult = await authorizeAdmin();
    if (!authResult.authorized) return authResult.response;

    let connection;
    try {
        connection = await pool.getConnection();
        const { searchParams } = new URL(req.url);
        const roleFilter = searchParams.get('role');

        let query = 'SELECT id, firstName, lastName, email, phoneNumber, role, createdAt, updatedAt FROM users';
        const queryParams = [];

        if (roleFilter && roleFilter.toLowerCase() === 'user') {
            query += ' WHERE role = ?'; // Utilisation de '?' pour les placeholders MySQL
            queryParams.push('USER');
        }
        query += ' ORDER BY createdAt DESC';

        const [rows] = await connection.execute(query, queryParams); // Utilisation de execute pour MySQL
        
        // Formater les noms pour qu'ils soient cohérents
        const formattedUsers = rows.map(user => ({
            ...user,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        }));

        return NextResponse.json(formattedUsers, { status: 200 });
    } catch (error) {
        console.error("Erreur GET utilisateurs:", error);
        return NextResponse.json({ message: "Erreur serveur lors de la récupération des utilisateurs.", error: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// PUT: Mettre à jour un utilisateur (ex: changer le rôle)
export async function PUT(req) {
    const authResult = await authorizeAdmin();
    if (!authResult.authorized) return authResult.response;

    const { id, role } = await req.json();

    if (!id || !role) {
        return NextResponse.json({ success: false, message: 'ID utilisateur et rôle sont requis.' }, { status: 400 });
    }

    if (role.toLowerCase() !== 'admin' && role.toLowerCase() !== 'user') {
        return NextResponse.json({ success: false, message: 'Rôle invalide. Doit être "admin" ou "user".' }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(
            `UPDATE users SET role = ?, updatedAt = NOW() WHERE id = ?`,
            [role.toUpperCase(), id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return NextResponse.json({ success: false, message: 'Utilisateur non trouvé ou rôle inchangé.' }, { status: 404 });
        }

        await connection.commit();
        return NextResponse.json({ success: true, message: 'Rôle utilisateur mis à jour.' }, { status: 200 });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Erreur PUT utilisateur:", error);
        return NextResponse.json({ success: false, message: `Erreur serveur lors de la mise à jour de l'utilisateur: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// DELETE: Supprimer un utilisateur
export async function DELETE(req) {
    const authResult = await authorizeAdmin();
    if (!authResult.authorized) return authResult.response;

    const { id } = await req.json();

    if (!id) {
        return NextResponse.json({ success: false, message: 'ID utilisateur est requis pour la suppression.' }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.execute(
            `DELETE FROM users WHERE id = ?`,
            [id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return NextResponse.json({ success: false, message: 'Utilisateur non trouvé.' }, { status: 404 });
        }

        await connection.commit();
        return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès.' }, { status: 200 });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error("Erreur DELETE utilisateur:", error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return NextResponse.json({ success: false, message: 'Impossible de supprimer l\'utilisateur car il est lié à des commandes ou d\'autres données. Veuillez supprimer les données liées d\'abord.' }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: `Erreur serveur lors de la suppression de l'utilisateur: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
