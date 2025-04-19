import { getRequestConfig } from 'next-intl/server';

const fallbackLocale = 'es';
const supportedLocales = ['es', 'en'];

export default getRequestConfig(async ({ locale }) => {
  const safeLocale = supportedLocales.includes(locale) ? locale : fallbackLocale;
  return {
    locale: safeLocale,
    messages: (await import(`../messages/${safeLocale}.json`)).default
  };
});
