    // app/api/users/login/route.js
    import { NextResponse } from 'next/server';
    import pool from '../../../../lib/db'; // Chemin vers lib/db.js depuis cette route API
    import bcrypt from 'bcryptjs';

    export async function POST(req) {
      let connection;
      try {
        const { email, password } = await req.json();

        if (!email || !password) {
          return NextResponse.json({ message: 'L\'email et le mot de passe sont requis.' }, { status: 400 });
        }

        connection = await pool.getConnection();

        const [users] = await connection.execute('SELECT id, email, password, firstName, lastName, role FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (!user) {
          return NextResponse.json({ message: 'Identifiants invalides.' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return NextResponse.json({ message: 'Identifiants invalides.' }, { status: 401 });
        }

        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({ message: 'Connexion réussie !', user: userWithoutPassword }, { status: 200 });

      } catch (error) {
        console.error('Erreur lors de la connexion de l\'utilisateur:', error);
        return NextResponse.json({ message: 'Erreur interne du serveur.', error: error.message }, { status: 500 });
      } finally {
        if (connection) connection.release();
      }
    }

    export async function GET(req) {
      return NextResponse.json({ message: 'Méthode GET non autorisée pour cette route.' }, { status: 405 });
    }
    