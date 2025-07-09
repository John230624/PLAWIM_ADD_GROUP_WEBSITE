import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authorizeUser } from '@/lib/authorizeUser';

export async function GET(req, context) {
  const { params } = context;
  const { userId } = params;
  const authResult = await authorizeUser(userId);
  if (!authResult.authorized) return authResult.response;

  try {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
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
    return NextResponse.json(addresses);
  } catch (error) {
    console.error("Erreur GET adresses:", error);
    return NextResponse.json(
      { message: "Erreur serveur lors de la récupération des adresses.", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req, context) {
  const { params } = context;
  const { userId } = params;
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
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: { userId, fullName, phoneNumber, pincode, area, city, state, isDefault },
      });
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
  const { params } = context;
  const { userId } = params;
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
    await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }
      await tx.address.update({
        where: { id, userId },
        data: { fullName, phoneNumber, pincode, area, city, state, isDefault },
      });
    });
    return NextResponse.json({ success: true, message: "Adresse mise à jour avec succès." });
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
  const { params } = context;
  const { userId } = params;
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
    await prisma.address.delete({
      where: { id, userId },
    });
    return NextResponse.json({ success: true, message: "Adresse supprimée." });
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
