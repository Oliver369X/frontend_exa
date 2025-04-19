// Client-side helper for retrieving JWT token
// Usar SOLO en componentes cliente ("use client") o hooks

/**
 * Obtiene el token JWT del almacenamiento del navegador (localStorage o cookie).
 * @returns {string | null}
 */
export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  // Intenta primero localStorage (más seguro en apps modernas)
  const localToken = window.localStorage.getItem("token");
  if (localToken) return localToken;
  // Alternativamente, busca en cookies por compatibilidad
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
