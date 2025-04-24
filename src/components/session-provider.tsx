"use client"; // SessionProvider requiere ser un Client Component

import { SessionProvider } from "next-auth/react";
import React, { ReactNode } from "react";

interface Props {
  children: ReactNode;
  // Podríamos necesitar pasar la session inicial si hacemos pre-rendering con sesión,
  // pero para empezar, no es estrictamente necesario.
  // session?: Session | null;
}

export default function AppSessionProvider({ children }: Props) {
  // Ahora sí envolvemos los children con el SessionProvider real de NextAuth
  return <SessionProvider>{children}</SessionProvider>;
}
