import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: "Non authentifié." }, { status: 401 });
  }

  const transactionId = uuidv4();
  return NextResponse.json({ success: true, transactionId }, { status: 200 });
}
