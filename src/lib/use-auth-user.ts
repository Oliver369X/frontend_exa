import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  [key: string]: any;
}

/**
 * Decodifica un JWT y retorna el payload como objeto.
 * @param token JWT string
 */
function decodeJwt(token: string): any {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

/**
 * Hook para obtener el usuario autenticado desde JWT en localStorage/cookie
 */
export function useAuthUser(): User | null {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    // Buscar token en localStorage primero, luego en cookies
    let token = null;
    if (typeof window !== "undefined") {
      token = window.localStorage.getItem("token");
      if (!token) {
        const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
        token = match ? decodeURIComponent(match[1]) : null;
      }
    }
    if (token) {
      const payload = decodeJwt(token);
      setUser(payload?.user || null);
    } else {
      setUser(null);
    }
  }, []);
  return user;
}
