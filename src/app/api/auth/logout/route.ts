import { NextResponse } from "next/server";

export async function POST() {
  // Limpia la cookie del JWT
  const response = NextResponse.json({ ok: true });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "lax",
    maxAge: 0,
  });
  return response;
}
