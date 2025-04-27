import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Añadir esta línea para forzar ejecución dinámica (sin caché)
export const dynamic = 'force-dynamic';

// Helper para obtener el token de la sesión
async function getTokenFromSession(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.backendToken ?? null;
}

export async function GET(req: NextRequest) {
  const token = await getTokenFromSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const res = await fetch(`${process.env.BACKEND_URL}/projects`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json({ projects: data });
}

export async function POST(req: NextRequest) {
  const token = await getTokenFromSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const res = await fetch(`${process.env.BACKEND_URL}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to create project" }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const token = await getTokenFromSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const res = await fetch(`${process.env.BACKEND_URL}/projects/${body.id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to update project" }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const token = await getTokenFromSession();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  }
  const res = await fetch(`${process.env.BACKEND_URL}/projects/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to delete project" }, { status: res.status });
  }
  return NextResponse.json({ success: true });
}
