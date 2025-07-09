import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { NextResponse } from 'next/server';

export async function authorizeUser(userIdFromParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.warn(`Tentative d'accès non authentifiée.`);
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }),
    };
  }

  if (String(session.user.id) !== String(userIdFromParams)) {
    console.warn(`Tentative d'accès non autorisé par userId ${session.user.id}`);
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Non autorisé.' }, { status: 403 }),
    };
  }

  return { authorized: true, session };
}
