"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useState, useEffect } from "react";
import { UserMenu } from "./user-menu";
import { ThemeToggle } from "./theme-toggle";

const locales = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
];

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [langOpen, setLangOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Chequea si hay cookie de sesión (token)
    // Para demo, también chequea localStorage por compatibilidad
    const hasToken = typeof window !== "undefined" && (localStorage.getItem("token") || document.cookie.includes("token="));
    setIsAuthenticated(!!hasToken);
  }, [pathname]);

  const handleLocaleChange = (code: string) => {
    const segments = pathname.split("/").filter(Boolean);
    if (locales.some((l) => l.code === segments[0])) {
      segments[0] = code;
    } else {
      segments.unshift(code);
    }
    router.push("/" + segments.join("/"));
    setLangOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-neutral-800 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Logo clickable, siempre visible, lleva a landing */}
        <Link href={`/${locale}`} className="font-bold text-xl tracking-tight focus:outline-none focus:ring-2 focus:ring-primary rounded">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Agents Platform</span>
        </Link>
        <ThemeToggle />
        {!isAuthenticated && (
          <>
            <Link href={`/${locale}/login`} className="px-4 py-2 rounded-lg font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
              {t("login")}
            </Link>
            <Link href={`/${locale}/register`} className="px-4 py-2 rounded-lg font-semibold text-primary hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors">
              {t("register")}
            </Link>
          </>
        )}
        {isAuthenticated && <UserMenu />}
        <button
          className="relative px-3 py-2 rounded-lg font-semibold text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-900 transition-colors"
          onClick={() => setLangOpen((v) => !v)}
        >
          {t("language")} <span className="ml-1">{locale.toUpperCase()}</span>
          {langOpen && (
            <div className="absolute right-0 mt-2 w-24 bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-lg z-10">
              {locales.map((l) => (
                <button
                  key={l.code}
                  className={`block w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-neutral-900 ${l.code === locale ? "text-primary font-bold" : "text-gray-900 dark:text-gray-100"}`}
                  onClick={() => handleLocaleChange(l.code)}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </button>
      </div>
    </nav>
  );
}
