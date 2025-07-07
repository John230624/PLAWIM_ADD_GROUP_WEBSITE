// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import pool from "../../../../lib/db"; // Path to your DB connection
import { v4 as uuidv4 } from 'uuid'; // Import uuid

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                let connection;
                try {
                    connection = await pool.getConnection();
                    const [users] = await connection.execute(
                        `SELECT id, email, password, firstName, lastName, role FROM users WHERE email = ?`,
                        [credentials.email]
                    );
                    const user = users[0];

                    if (!user) {
                        console.log("Credentials authorize: User not found for email:", credentials.email);
                        return null; // Utilisateur non trouvé
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isPasswordValid) {
                        console.log("Credentials authorize: Invalid password for email:", credentials.email);
                        return null; // Mot de passe incorrect
                    }

                    // Retourner l'objet utilisateur avec l'ID, le rôle et le nom complet de la DB
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    console.log("Credentials authorize: User authorized:", { id: user.id, email: user.email, name: fullName, role: user.role });
                    return {
                        id: user.id, // ID de la base de données
                        email: user.email,
                        name: fullName,
                        role: user.role,
                    };
                } catch (error) {
                    console.error("Erreur d'autorisation des identifiants:", error);
                    return null;
                } finally {
                    if (connection) connection.release();
                }
            },
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        // Ce callback est appelé lorsqu'un utilisateur se connecte,
        // et est particulièrement important pour les fournisseurs OAuth (comme Google)
        // pour gérer la création/recherche d'utilisateurs dans votre DB.
        async signIn({ user, account, profile }) {
            console.log("signIn callback (début):", { user, account, profile });

            if (account.provider === "google") {
                let connection;
                try {
                    connection = await pool.getConnection();

                    // 1. Vérifier si l'utilisateur existe déjà par son email
                    const [existingUsers] = await connection.execute(
                        `SELECT id, role, firstName, lastName FROM users WHERE email = ?`,
                        [user.email]
                    );

                    let dbUserId = null;
                    let dbUserRole = 'USER'; // Rôle par défaut pour les nouveaux utilisateurs
                    let dbUserName = user.name; // Nom par défaut de l'objet utilisateur OAuth

                    if (existingUsers.length === 0) {
                        // L'utilisateur n'existe pas, le créer dans la base de données
                        dbUserId = uuidv4(); // Générer un nouvel UUID pour l'ID
                        // Générer un mot de passe aléatoire et le hacher (requis pour la colonne password)
                        const hashedPassword = await bcrypt.hash(uuidv4(), 10); 
                        
                        const firstName = profile?.given_name || (user.name ? user.name.split(' ')[0] : 'Utilisateur');
                        const lastName = profile?.family_name || (user.name ? user.name.split(' ').slice(1).join(' ') : 'Google');
                        dbUserName = `${firstName} ${lastName}`.trim(); // Construire le nom complet

                        await connection.execute(
                            `INSERT INTO users (id, firstName, lastName, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
                            [dbUserId, firstName, lastName, user.email, hashedPassword, dbUserRole]
                        );
                        console.log(`signIn Google: Nouvel utilisateur créé dans la DB: ${user.email} (ID: ${dbUserId})`);
                    } else {
                        // L'utilisateur existe, récupérer son ID et son rôle de la base de données
                        const existingDbUser = existingUsers[0];
                        dbUserId = existingDbUser.id;
                        dbUserRole = existingDbUser.role; // Utiliser le rôle existant
                        dbUserName = `${existingDbUser.firstName || ''} ${existingDbUser.lastName || ''}`.trim();

                        console.log(`signIn Google: Utilisateur existant connecté: ${user.email} (ID: ${dbUserId})`);
                        // Optionnel: Mettre à jour la date de dernière connexion ou d'autres informations
                    }

                    // IMPORTANT: Mettre à jour l'objet 'user' que NextAuth utilisera
                    // pour les callbacks suivants (jwt, session).
                    // S'assurer que le champ 'id' est défini sur l'ID de votre base de données.
                    user.id = dbUserId;
                    user.role = dbUserRole;
                    user.name = dbUserName; // Assurer que user.name est correct pour la session

                    return true; // Autoriser la connexion
                } catch (error) {
                    console.error("Erreur lors de la gestion du signIn Google:", error);
                    return false; // Empêcher la connexion en cas d'erreur
                } finally {
                    if (connection) connection.release();
                }
            }
            // Pour les autres fournisseurs (comme Credentials), retourner true pour autoriser signIn
            return true;
        },

        // Ce callback est appelé chaque fois qu'un JWT est créé ou mis à jour (après signIn, ou rafraîchissement de session)
        async jwt({ token, user, account, profile }) {
            console.log("jwt callback (début):", { token, user, account, profile });

            // L'objet 'user' est disponible ici après la fonction 'authorize' (Credentials)
            // ou 'signIn' (OAuth)
            if (user) {
                token.id = user.id; // C'est crucial : définir l'ID de la DB sur le token
                token.email = user.email;
                token.name = user.name;
                token.role = user.role; // Définir le rôle sur le token
            } else if (token.email) {
                // Si 'user' n'est pas disponible (ex: rafraîchissement du token),
                // essayer de charger les données utilisateur depuis la DB
                // Cela garantit que le token a les dernières données utilisateur (comme les changements de rôle)
                let connection;
                try {
                    connection = await pool.getConnection();
                    const [dbUsers] = await connection.execute(
                        `SELECT id, firstName, lastName, email, role FROM users WHERE email = ?`,
                        [token.email]
                    );
                    if (dbUsers.length > 0) {
                        const dbUser = dbUsers[0];
                        token.id = dbUser.id;
                        token.name = `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim();
                        token.role = dbUser.role;
                    }
                } catch (error) {
                    console.error("Erreur lors de la récupération de l'utilisateur pour le JWT:", error);
                } finally {
                    if (connection) connection.release();
                }
            }
            console.log("jwt callback (fin) - Token mis à jour:", token);
            return token;
        },

        // Ce callback est appelé chaque fois qu'une session est vérifiée (côté client)
        async session({ session, token }) {
            console.log("session callback (début):", { session, token });
            // Remplir session.user avec les données du token JWT
            if (token) {
                session.user.id = token.id; // Assurer que l'ID du JWT est assigné
                session.user.email = token.email;
                session.user.name = token.name;
                session.user.role = token.role; // Assigner le rôle à session.user
                // Ne pas assigner session.user.token = token.id; car session.user.id est déjà l'ID de la DB
            }
            console.log("session callback (fin) - Session mise à jour:", session);
            return session;
        },
    },
    pages: {
        signIn: "/login", // Redirige vers votre page de connexion personnalisée
    },
    // Active le mode débogage en développement
    debug: process.env.NODE_ENV === "development",
    secret: process.env.NEXTAUTH_SECRET, // Assurez-vous que cette variable est définie dans votre .env
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
