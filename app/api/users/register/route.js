    // app/api/users/register/route.js
    import { NextResponse } from 'next/server';
    import pool from '../../../../lib/db'; // Chemin vers lib/db.js depuis cette route API
    import bcrypt from 'bcryptjs';

    export async function POST(req) {
      let connection;
      try {
        const { email, password, firstName, lastName } = await req.json();

        if (!email || !password) {
          return NextResponse.json({ message: 'L\'email et le mot de passe sont requis.' }, { status: 400 });
        }

        connection = await pool.getConnection();

        const [existingUsers] = await connection.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
          return NextResponse.json({ message: 'Cet email est déjà enregistré.' }, { status: 409 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await connection.execute(
          'INSERT INTO users (email, password, firstName, lastName) VALUES (?, ?, ?, ?)',
          [email, hashedPassword, firstName || null, lastName || null]
        );

        return NextResponse.json({ message: 'Inscription réussie !', userId: result.insertId }, { status: 201 });

      } catch (error) {
        console.error('Erreur lors de l\'inscription de l\'utilisateur:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
      } finally {
        if (connection) connection.release();
      }
    }

    export async function GET(req) {
      return NextResponse.json({ message: 'Méthode GET non autorisée pour cette route.' }, { status: 405 });
    }
    