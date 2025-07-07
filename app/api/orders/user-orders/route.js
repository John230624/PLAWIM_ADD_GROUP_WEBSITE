import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from 'next-auth/react';

export async function GET(request) {
  const session = await getSession({ req: request });
  if (!session) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
  const userId = session.user.id;

  // Récupérer les commandes de l'utilisateur
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ orders });
}
