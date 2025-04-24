// src/components/providers/auth-provider.tsx
"use client"; // Este componente debe ser un Client Component

import { SessionProvider } from "next-auth/react";
import React from "react";

interface AuthProviderProps {
  children: React.ReactNode;
  // Podríamos necesitar pasar la session inicial si hacemos pre-rendering con sesión,
  // pero para empezar, no es estrictamente necesario.
  // session?: Session | null;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // El SessionProvider recibe la sesión opcionalmente y la hace disponible via useSession
  return <SessionProvider>{children}</SessionProvider>;
}
