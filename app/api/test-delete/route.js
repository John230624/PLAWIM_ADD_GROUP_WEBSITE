// app/api/test/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  console.log("GET test route hit!");
  return NextResponse.json({ message: "GET test OK" }, { status: 200 });
}

export async function DELETE() {
  console.log("DELETE test route hit!");
  return NextResponse.json({ message: "DELETE test OK" }, { status: 200 });
}