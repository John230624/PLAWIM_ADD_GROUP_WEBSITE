// lib/authOptions.js
import { PrismaAdapter } from "@next-auth/prisma-adapter"; // Importe l'adaptateur Prisma
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs"; // Assure-toi que bcryptjs est installé
import prisma from "./prisma"; // Importer le client Prisma que tu as créé dans lib/prisma.js
// La bibliothèque 'uuid' n'est plus nécessaire car Prisma gère les UUID via @default(uuid())

export const authOptions = {
  // Utilise l'adaptateur Prisma pour gérer les utilisateurs, sessions, et comptes OAuth
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Recherche l'utilisateur par email en utilisant Prisma
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null; // Aucun utilisateur trouvé
        }

        // Vérification du mot de passe avec bcrypt
        // Attention: Si l'utilisateur vient d'OAuth, son champ password pourrait être vide ou un hash aléatoire.
        // Assure-toi que ton processus d'inscription "Credentials" crée un hash de mot de passe.
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          return null; // Mot de passe invalide
        }

        // Retourne les infos essentielles pour NextAuth
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          role: user.role,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // La création/mise à jour de l'utilisateur via Google est gérée par PrismaAdapter par défaut.
      // Si tu as besoin de logique personnalisée après la création (ex: définir un rôle par défaut),
      // tu peux utiliser le callback `linkAccount` de NextAuth (non montré ici car l'adaptateur gère l'essentiel).
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  callbacks: {
    // Le callback `signIn` n'est plus nécessaire pour la logique de création/mise à jour d'utilisateurs OAuth
    // car `PrismaAdapter` gère cela automatiquement.
    // Tu n'auras besoin de ce callback que si tu veux ajouter une logique spécifique avant ou après la connexion,
    // comme des vérifications supplémentaires ou des redirections conditionnelles.
    // async signIn({ user, account, profile }) {
    //   // Si tu as une logique spéciale pour les fournisseurs OAuth au-delà de ce que l'adaptateur fait,
    //   // tu la mettrais ici. Par exemple, forcer un rôle spécifique pour certains emails.
    //   return true; // Retourne true pour autoriser la connexion
    // },

    // Ce callback est appelé quand un JWT est créé ou mis à jour.
    // 'user' est seulement défini lors de la connexion initiale (via authorize ou OAuth).
    async jwt({ token, user }) {
      if (user) {
        // Le `user` retourné par l'adaptateur Prisma ou CredentialsProvider
        // aura les propriétés de ton modèle `User`.
        // Assure-toi que ton modèle User dans Prisma inclut `id`, `email`, `name`, `role`.
        token.id = user.id;
        token.email = user.email;
        token.name = user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(); // Assure-toi que le nom est bien formé
        token.role = user.role; // Ajoute le rôle de l'utilisateur au token
      }
      return token;
    },

    // Ce callback est appelé à chaque fois qu'une session est accédée.
    // Il permet de peupler l'objet `session.user` avec les données du `token`.
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
        };
      }
      return session;
    },
  },

  pages: {
    signIn: "/login", // Redirige vers ta page de connexion personnalisée
  },

  secret: process.env.NEXTAUTH_SECRET, // Une chaîne secrète pour signer les JWT
};