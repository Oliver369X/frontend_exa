import { ReactNode } from "react";

/**
 * Reemplazo del Portal que simplemente renderiza los children directamente
 * sin usar createPortal para evitar problemas de manipulación del DOM.
 * @param children Elementos a renderizar.
 */
export function Portal({ children }: { children: ReactNode }) {
  // Simplemente renderizar los children directamente
  return <>{children}</>;
}
