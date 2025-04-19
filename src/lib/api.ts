// src/lib/api.ts

/**
 * Devuelve la URL absoluta para una ruta de API, usando la variable de entorno NEXT_PUBLIC_BACKEND_URL.
 * @param path Ruta relativa de la API, debe comenzar con '/'
 */
export function getApiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || '';
  return `${base}${path}`;
}
