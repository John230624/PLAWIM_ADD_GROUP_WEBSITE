import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

async function authorizeUser(userIdFromParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    console.warn(`Tentative d'accès non authentifiée à /api/addresses/${userIdFromParams}`);
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Non authentifié.' }, { status: 401 }),
    };
  }

  if (String(session.user.id) !== String(userIdFromParams)) {
    console.warn(`Tentative d'accès non autorisé à /api/addresses/${userIdFromParams} par userId ${session.user.id}`);
    return {
      authorized: false,
      response: NextResponse.json({ message: 'Non autorisé.' }, { status: 403 }),
    };
  }

  return { authorized: true, userId: userIdFromParams, session };
}

export async function GET(req, context) {
  // --- CORRECTION HERE ---
  const params = await context.params;
  const userId = params.userId;
  // --- END CORRECTION ---

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  try {
    const addresses = await prisma.address.findMany({
      where: { userId: userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        pincode: true,
        area: true,
        city: true,
        state: true,
        isDefault: true,
      },
    });
    return NextResponse.json(addresses, { status: 200 });
  } catch (error) {
    console.error("Erreur GET adresses:", error);
    return NextResponse.json(
      { message: "Erreur serveur lors de la récupération des adresses.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req, context) {
  // --- CORRECTION HERE ---
  const params = await context.params;
  const userId = params.userId;
  // --- END CORRECTION ---

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  const { fullName, phoneNumber, pincode, area, city, state, isDefault = false } = await req.json();

  if (!fullName || !phoneNumber || !area || !city || !state) {
    return NextResponse.json(
      { success: false, message: "Tous les champs d'adresse requis ne sont pas fournis." },
      { status: 400 }
    );
  }

  try {
    const newAddress = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: {
            userId: userId,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const createdAddress = await tx.address.create({
        data: {
          userId: userId,
          fullName: fullName,
          phoneNumber: phoneNumber,
          pincode: pincode,
          area: area,
          city: city,
          state: state,
          isDefault: isDefault,
        },
      });
      return createdAddress;
    });

    return NextResponse.json(
      { success: true, message: "Adresse ajoutée avec succès.", id: newAddress.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST adresse:", error);
    return NextResponse.json(
      { success: false, message: `Erreur serveur lors de l'ajout de l'adresse: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PUT(req, context) {
  // --- CORRECTION HERE ---
  const params = await context.params;
  const userId = params.userId;
  // --- END CORRECTION ---

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  const { id, fullName, phoneNumber, pincode, area, city, state, isDefault } = await req.json();

  if (
    !id ||
    fullName === undefined ||
    phoneNumber === undefined ||
    area === undefined ||
    city === undefined ||
    state === undefined ||
    isDefault === undefined
  ) {
    return NextResponse.json(
      { success: false, message: "L'ID et tous les champs d'adresse sont requis pour la mise à jour." },
      { status: 400 }
    );
  }

  try {
    const updatedAddress = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: {
            userId: userId,
            isDefault: true,
            id: {
              not: id,
            },
          },
          data: {
            isDefault: false,
          },
        });
      }

      const result = await tx.address.update({
        where: {
          id: id,
          userId: userId,
        },
        data: {
          fullName: fullName,
          phoneNumber: phoneNumber,
          pincode: pincode,
          area: area,
          city: city,
          state: state,
          isDefault: isDefault,
        },
      });
      return result;
    });

    return NextResponse.json(
      { success: true, message: "Adresse mise à jour avec succès." },
      { status: 200 }
    );
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: "Adresse non trouvée ou non autorisée." },
        { status: 404 }
      );
    }
    console.error("Erreur PUT adresse:", error);
    return NextResponse.json(
      { success: false, message: `Erreur serveur: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(req, context) {
  // --- CORRECTION HERE ---
  const params = await context.params;
  const userId = params.userId;
  // --- END CORRECTION ---

  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { success: false, message: "L'ID de l'adresse est requis." },
      { status: 400 }
    );
  }

  try {
    const deletedAddress = await prisma.address.delete({
      where: {
        id: id,
        userId: userId,
      },
    });

    return NextResponse.json(
      { success: true, message: "Adresse supprimée." },
      { status: 200 }
    );
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, message: "Adresse non trouvée ou non autorisée." },
        { status: 404 }
      );
    }
    console.error("Erreur DELETE adresse:", error);
    return NextResponse.json(
      { success: false, message: `Erreur serveur: ${error.message}` },
      { status: 500 }
    );
  }
}