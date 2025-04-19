import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localeDetection: true,
});

export const config = {
  matcher: [
    // Protege rutas privadas
    '/((?!api|_next|static|favicon.ico|public).*)',
  ],
};
