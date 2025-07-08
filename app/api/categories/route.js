// C:\xampp\htdocs\01_PlawimAdd_Avec_Auth\app\api\categories\route.js
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma'; // Make sure the path is correct.

/**
 * Handles the GET request to retrieve all categories.
 * @param {Request} req - The Next.js Request object.
 * @returns {Promise<NextResponse>}
 */
export async function GET(req) {
  try {
    // Use prisma.category.findMany to retrieve all categories
    const categories = await prisma.category.findMany();
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Error retrieving categories:', error);
    return NextResponse.json(
      { message: 'Internal server error.', error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handles the POST request to create a new category.
 * @param {Request} req - The Next.js Request object.
 * @returns {Promise<NextResponse>}
 */
export async function POST(req) {
  try {
    const { name, description, imageUrl } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Category name is required.' },
        { status: 400 }
      );
    }

    // Check if the category already exists by name
    const existingCategory = await prisma.category.findUnique({
      where: { name: name }, // Ensure the 'name' field is unique in your schema.prisma
    });

    if (existingCategory) {
      return NextResponse.json(
        { message: 'This category already exists.' },
        { status: 409 }
      );
    }

    // Create the new category using prisma.category.create
    const newCategory = await prisma.category.create({
      data: {
        name: name,
        description: description, // Prisma handles null if the value is null/undefined
        imageUrl: imageUrl,       // Prisma handles null if the value is null/undefined
        // createdAt and updatedAt are automatically managed by Prisma if @default(now()) and @updatedAt are defined in the schema
      },
    });

    return NextResponse.json(
      { message: 'Category created successfully!', categoryId: newCategory.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);
    // Handle P2002 error (unique constraint violation) if the name is set as unique in the schema
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      return NextResponse.json(
        { message: 'A category with this name already exists.' },
        { status: 409 } // Conflict
      );
    }
    return NextResponse.json(
      { message: 'Internal server error.', error: error.message },
      { status: 500 }
    );
  }
}