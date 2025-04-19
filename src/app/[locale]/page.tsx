"use client";
import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { Navbar } from "@/components/nav/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const t = useTranslations("landing");
  const router = useRouter();
  const locale = useLocale();

  // Handler para el botón Comenzar
  function handleGetStarted() {
    // Verifica si hay token en localStorage o cookie
    const hasToken = typeof window !== "undefined" && (localStorage.getItem("token") || document.cookie.includes("token="));
    if (hasToken) {
      router.push(`/${locale}/dashboard`);
    } else {
      router.push(`/${locale}/register`);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center bg-white dark:bg-neutral-950 transition-colors">
      <Navbar />
      {/* Hero principal minimalista */}
      <main className="w-full flex flex-col items-center justify-center mt-32 mb-16 px-4">
        <Card className="w-full max-w-2xl mx-auto p-10 flex flex-col items-center gap-6 shadow-lg border border-gray-200 dark:border-neutral-800">
          <h1 className="text-4xl font-extrabold text-center mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-lg text-center text-gray-700 dark:text-gray-300 mb-8">{t("subtitle")}</p>
          <Button
            className="w-full max-w-xs py-3 text-lg font-bold rounded-xl shadow-lg bg-gradient-to-r from-primary to-secondary hover:scale-105 transition-transform"
            onClick={handleGetStarted}
          >
            {t("get_started")}
          </Button>
        </Card>
      </main>
      {/* Features minimalistas */}
      <section id="features" className="w-full max-w-4xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8 px-4">
        <Card className="flex flex-col items-center p-6 gap-2 border border-gray-200 dark:border-neutral-800">
          <span className="text-3xl mb-2">🤖</span>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("feature_agents")}</h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm text-center">{t("feature_agents_desc")}</p>
        </Card>
        <Card className="flex flex-col items-center p-6 gap-2 border border-gray-200 dark:border-neutral-800">
          <span className="text-3xl mb-2">🔒</span>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("feature_security")}</h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm text-center">{t("feature_security_desc")}</p>
        </Card>
        <Card className="flex flex-col items-center p-6 gap-2 border border-gray-200 dark:border-neutral-800">
          <span className="text-3xl mb-2">🚀</span>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{t("feature_ux")}</h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm text-center">{t("feature_ux_desc")}</p>
        </Card>
      </section>
      {/* Footer minimalista */}
      <footer className="mt-20 mb-6 text-gray-500 dark:text-gray-400 text-center text-sm">
        {t("footer")}
      </footer>
    </div>
  );
}
