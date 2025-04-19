// Simple auth util for SSR/edge (server components)
// ⚠️ SOLO importar este helper en archivos server/componentes server dentro de /app, nunca en componentes cliente ni en /pages
import { cookies } from "next/headers";

export async function getToken(): Promise<string | null> {
  // Busca el JWT en cookies (mejor práctica que localStorage para rutas protegidas SSR)
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  return token?.value ?? null;
}
