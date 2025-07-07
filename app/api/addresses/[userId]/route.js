// app/api/addresses/[userId]/route.js
import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Assurez-vous que ce chemin est correct
import { v4 as uuidv4 } from 'uuid';

// Fonction utilitaire d'autorisation (réutilisable)
async function authorizeUser(req, context) {
    const session = await getServerSession(authOptions);
    // CORRECTION: await context.params pour éviter l'avertissement Next.js
    const { userId: userIdFromParams } = context.params;

    if (!session) {
        console.warn(`Tentative d'accès non authentifiée à /api/addresses/${userIdFromParams}`);
        return { authorized: false, response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }) };
    }
    // CORRECTION: Assurer la comparaison de type String pour les IDs
    if (String(session.user.id) !== String(userIdFromParams)) {
        console.warn(`Tentative d'accès non autorisé à /api/addresses/${userIdFromParams} par userId ${session.user.id}`);
        return { authorized: false, response: NextResponse.json({ message: 'Non autorisé.' }, { status: 403 }) };
    }
    return { authorized: true, userId: userIdFromParams };
}

// GET: Récupérer les adresses d'un utilisateur
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
        return NextResponse.json(addresses, { status: 200 }); // Retourne directement le tableau des adresses
    } catch (error) {
        console.error("Erreur GET adresses:", error);
        return NextResponse.json({ message: "Erreur serveur lors de la récupération des adresses.", error: error.message }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// POST: Ajouter une adresse
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
        const newAddressId = uuidv4(); // Générer un UUID unique pour la nouvelle adresse
        const [result] = await connection.execute(
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

// PUT: Mettre à jour une adresse existante (et potentiellement la marquer comme par défaut)
export async function PUT(req, context) {
    const authResult = await authorizeUser(req, context);
    if (!authResult.authorized) return authResult.response;
    const userId = authResult.userId; // L'utilisateur authentifié

    const { id, fullName, phoneNumber, pincode, area, city, state, isDefault } = await req.json(); // L'ID de l'adresse à modifier

    if (!id || fullName === undefined || phoneNumber === undefined || area === undefined || city === undefined || state === undefined || isDefault === undefined) {
        return NextResponse.json({ success: false, message: "L'ID et tous les champs d'adresse (fullName, phoneNumber, pincode, area, city, state, isDefault) sont requis pour la mise à jour." }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction(); // Démarre une transaction

        // Si cette adresse est définie comme par défaut, désactivez les autres adresses par défaut de cet utilisateur
        if (isDefault) {
            await connection.execute(
                `UPDATE addresses SET isDefault = 0 WHERE userId = ? AND id != ?`,
                [userId, id]
            );
        }

        // Mettre à jour l'adresse spécifique
        const [result] = await connection.execute(
            `UPDATE addresses SET 
                fullName = ?, 
                phoneNumber = ?, 
                pincode = ?, 
                area = ?, 
                city = ?, 
                state = ?, 
                isDefault = ?,
                updatedAt = NOW()
             WHERE id = ? AND userId = ?`,
            [fullName, phoneNumber, pincode, area, city, state, isDefault, id, userId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback(); // Annule la transaction si l'adresse n'est pas trouvée/mise à jour
            return NextResponse.json({ success: false, message: "Adresse non trouvée dans la base de données pour cet utilisateur ou non autorisée." }, { status: 404 });
        }

        await connection.commit(); // Valide la transaction
        return NextResponse.json({ success: true, message: "Adresse mise à jour avec succès et statut par défaut ajusté." }, { status: 200 });
    } catch (error) {
        if (connection) {
            await connection.rollback(); // Annule la transaction en cas d'erreur
        }
        console.error("Erreur PUT adresse:", error);
        return NextResponse.json({ success: false, message: `Erreur serveur lors de la mise à jour de l'adresse: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}

// DELETE: Supprimer une adresse
export async function DELETE(req, context) {
    const authResult = await authorizeUser(req, context);
    if (!authResult.authorized) return authResult.response;
    const userId = authResult.userId;

    const { id } = await req.json(); // L'ID de l'adresse à supprimer

    if (!id) {
        return NextResponse.json({ success: false, message: "L'ID de l'adresse est requis pour la suppression." }, { status: 400 });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(
            `DELETE FROM addresses WHERE id = ? AND userId = ?`,
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ success: false, message: "Adresse non trouvée ou non autorisée pour la suppression." }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Adresse supprimée avec succès." }, { status: 200 });
    } catch (error) {
        console.error("Erreur DELETE adresse:", error);
        return NextResponse.json({ success: false, message: `Erreur serveur lors de la suppression de l'adresse: ${error.message}` }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }
}
