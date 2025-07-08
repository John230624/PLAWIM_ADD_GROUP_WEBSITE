// lib/authOptions.js

import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import pool from "./db";
import { v4 as uuidv4 } from "uuid";

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
          if (!user) return null;

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            role: user.role,
          };
        } catch (err) {
          console.error("authorize error", err);
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
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        let connection;
        try {
          connection = await pool.getConnection();
          const [existingUsers] = await connection.execute(
            `SELECT id, role, firstName, lastName FROM users WHERE email = ?`,
            [user.email]
          );

          let dbUserId, dbUserRole = "USER", dbUserName = user.name;

          if (existingUsers.length === 0) {
            dbUserId = uuidv4();
            const hashedPassword = await bcrypt.hash(uuidv4(), 10); // mot de passe random
            const firstName = profile?.given_name || user.name?.split(" ")[0];
            const lastName = profile?.family_name || user.name?.split(" ").slice(1).join(" ");
            dbUserName = `${firstName} ${lastName}`.trim();

            await connection.execute(
              `INSERT INTO users (id, firstName, lastName, email, password, role) VALUES (?, ?, ?, ?, ?, ?)`,
              [dbUserId, firstName, lastName, user.email, hashedPassword, dbUserRole]
            );
          } else {
            const existingUser = existingUsers[0];
            dbUserId = existingUser.id;
            dbUserRole = existingUser.role;
            dbUserName = `${existingUser.firstName || ""} ${existingUser.lastName || ""}`.trim();
          }

          user.id = dbUserId;
          user.role = dbUserRole;
          user.name = dbUserName;

          return true;
        } catch (err) {
          console.error("signIn Google error:", err);
          return false;
        } finally {
          if (connection) connection.release();
        }
      }

      return true; // pour les autres providers (Credentials)
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },

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
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
