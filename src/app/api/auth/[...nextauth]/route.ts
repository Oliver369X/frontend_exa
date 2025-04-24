// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getApiUrl } from "@/lib/api"; // Asumimos que getApiUrl existe y funciona

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // El nombre para mostrar en el formulario de inicio de sesión (opcional)
      name: "Credentials",
      // `credentials` se usa para generar un formulario en la página de inicio de sesión predeterminada.
      // Puedes especificar los campos que esperas que se envíen.
      // ej. domain, username, password, 2FA token, etc.
      // Puedes pasar cualquier atributo HTML adicional al <input> a través del objeto.
      credentials: {
        email: { label: "Email", type: "email", placeholder: "tu@email.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("[NextAuth Authorize] Starting..."); // Log start
        if (!credentials?.email || !credentials?.password) {
          console.log("[NextAuth Authorize] Missing credentials.");
          return null;
        }
        try {
          const loginUrl = getApiUrl('/auth/login');
          console.log(`[NextAuth Authorize] Attempting login via: ${loginUrl}`);
          const res = await fetch(loginUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
          console.log(`[NextAuth Authorize] Backend response status: ${res.status}`);
          if (!res.ok) {
             console.error(`[NextAuth Authorize] Login failed: ${res.statusText}`);
             throw new Error("Credenciales inválidas");
          }
          const responseData = await res.json();
          console.log("[NextAuth Authorize] Backend response data:", responseData);
          // Adaptar la verificación a la respuesta REAL del backend
          // El backend devuelve: { id, name, token }
          if (responseData && responseData.token && responseData.id && responseData.name) {
            console.log("[NextAuth Authorize] Success, returning user object from backend response.");
            // Construir el objeto user para NextAuth usando los datos directos de la respuesta
            return {
                id: responseData.id,           // Usar responseData.id directamente
                name: responseData.name,         // Usar responseData.name directamente
                email: credentials.email,    // El backend no devuelve email, lo tomamos de las credenciales originales
                backendToken: responseData.token, // Usar responseData.token
            };
          } else {
            console.error("[NextAuth Authorize] Backend response missing token, id or name.");
            return null;
          }
        } catch (error) {
          console.error("[NextAuth Authorize] Error during authorization:", error);
          // Devuelve null si ocurre un error o las credenciales son inválidas
          // Puedes lanzar un error específico si quieres manejarlo de forma diferente
          // throw new Error("Error de autenticación");
          return null;
        }
      },
    }),
  ],
  session: {
    // Usaremos JSON Web Tokens para las sesiones en lugar de sesiones de base de datos.
    strategy: "jwt",
  },
  callbacks: {
    // Este callback se ejecuta cuando se crea/actualiza un JWT (ej. al iniciar sesión).
    // El objeto `user` que devolvimos en `authorize` está disponible aquí la primera vez.
    // El objeto `token` es el JWT de NextAuth.
    async jwt({ token, user, account }) {
      console.log("[NextAuth JWT Callback] Fired. User:", !!user, "Account:", !!account);
      // Al iniciar sesión (user y account están presentes), persistimos el token del backend en el JWT de NextAuth.
      if (account && user?.backendToken) {
        console.log("[NextAuth JWT Callback] Persisting backendToken:", user.backendToken);
        token.backendToken = user.backendToken;
        token.userId = user.id; // Guardamos el ID del usuario también
        // Puedes añadir más datos del 'user' al token aquí si los necesitas a menudo
        token.name = user.name;
        token.email = user.email;
      }
      console.log("[NextAuth JWT Callback] Returning token:", token);
      return token;
    },
    // Este callback se ejecuta cuando se accede a la sesión (ej. con useSession).
    // El objeto `token` es el JWT decodificado que devolvió el callback `jwt`.
    async session({ session, token }) {
      console.log("[NextAuth Session Callback] Fired. Token:", token);
      // Hacemos que el token del backend y el ID del usuario estén disponibles en el objeto `session`
      // que recibe `useSession()`.
      if (token?.backendToken) {
        session.backendToken = token.backendToken as string;
      }
      if (session.user && token?.userId) {
         // Asegúrate de que la interfaz Session y User en tu archivo de tipos (si lo tienes)
         // permita estas propiedades personalizadas.
        session.user.id = token.userId as string;
      }
       // Puedes añadir name y email también si los necesitas directamente en session.user
      if (session.user && token?.name) session.user.name = token.name as string;
      if (session.user && token?.email) session.user.email = token.email as string;
      console.log("[NextAuth Session Callback] Returning session:", session);
      return session;
    },
  },
  // Opcional: Define páginas personalizadas si no quieres usar las predeterminadas
  // pages: {
  //   signIn: '/auth/signin',
  //   // signOut: '/auth/signout',
  //   // error: '/auth/error', // Error code passed in query string as ?error=
  //   // verifyRequest: '/auth/verify-request', // (used for email/passwordless login)
  //   // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out if not of interest)
  // },
  // Necesitas una clave secreta para firmar los JWTs. Usa una variable de entorno.
  secret: process.env.NEXTAUTH_SECRET,
  // debug: process.env.NODE_ENV === 'development', // Opcional: Habilita logs de debug en desarrollo
};

// NextAuth v4 exporta los handlers GET y POST directamente
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
