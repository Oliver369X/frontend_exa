"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { z } from "zod";
import { getApiUrl } from "@/lib/api";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export function RegisterForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHasError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const values = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      name: formData.get("name") as string,
    };
    const parse = RegisterSchema.safeParse(values);
    if (!parse.success) {
      setHasError(t("error"));
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        setHasError(t("error"));
        setIsLoading(false);
        return;
      }
      // Registro exitoso, redirige a login
      router.push(`/${locale}/login`);
    } catch (err) {
      setHasError(t("error"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-4 w-full max-w-md mx-auto bg-white/80 dark:bg-neutral-800/80 border border-gray-300 dark:border-gray-700 shadow-lg rounded-2xl px-6 py-8 sm:px-8 sm:py-10"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
      <div className="mb-4">
        <label htmlFor="name" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
          {t("name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary/70 text-gray-900 dark:text-gray-100 text-base sm:text-lg placeholder-gray-400"
          placeholder={t("name_placeholder")}
        />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
          {t("email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary/70 text-gray-900 dark:text-gray-100 text-base sm:text-lg placeholder-gray-400"
          placeholder="user@example.com"
        />
      </div>
      <div className="mb-4">
        <label htmlFor="password" className="block mb-1 font-semibold text-gray-900 dark:text-gray-100 text-base sm:text-lg">
          {t("password")}
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={6}
            className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-secondary/70 text-gray-900 dark:text-gray-100 pr-10 text-base sm:text-lg placeholder-gray-400"
            aria-label={t("password")}
            placeholder={t("password_placeholder")}
          />
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? t("hide-password-visibility") : t("show-password-visibility")}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
            style={{ pointerEvents: "auto" }}
            onClick={() => setShowPassword(!showPassword)}
            id="show-password-toggle"
          >
            <span className="sr-only">{t("show_password")}</span>
            {/* icon */}
          </button>
        </div>
      </div>
      {hasError && (
        <div className="text-sm text-red-400 text-center mt-2">{hasError}</div>
      )}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-secondary to-primary text-black dark:text-white font-bold shadow-lg hover:scale-105 transition-transform border-2 border-secondary/60 backdrop-blur-md disabled:opacity-60 text-base sm:text-lg"
      >
        {isLoading ? "..." : t("submit")}
      </button>
    </form>
  );
}
