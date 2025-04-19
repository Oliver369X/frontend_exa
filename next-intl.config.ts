import { Pathnames } from 'next-intl/navigation';

export const locales = ['es', 'en'] as const;
export const defaultLocale = 'es';

export const pathnames = {
  '/': '/',
  '/login': '/login',
  '/register': '/register',
  '/dashboard': '/dashboard',
  '/projects': '/projects',
  '/settings': '/settings',
} satisfies Pathnames<typeof locales>;

export const localePrefix = 'always';
