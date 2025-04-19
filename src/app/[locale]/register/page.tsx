import React from "react";
import { useTranslations } from "next-intl";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  const t = useTranslations("auth");
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/80 dark:bg-neutral-900/80 border border-gray-200 dark:border-neutral-800 shadow-lg backdrop-blur-md mt-24">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">{t("register_title")}</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
