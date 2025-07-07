// app/SessionProvider.js
'use client'; // TRÈS IMPORTANT : Doit être un Client Component

import { SessionProvider } from "next-auth/react";

/**
 * Ce composant enveloppe votre application pour fournir le contexte de session de NextAuth.js.
 * Il doit être un Client Component pour utiliser `SessionProvider` de `next-auth/react`.
 */
export default function NextAuthSessionProvider({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
