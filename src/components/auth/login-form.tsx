"use client";
import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { z } from "zod";
import { signIn } from "next-auth/react";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || `/${locale}/dashboard`;
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setHasError("");
    setIsLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const parse = LoginSchema.safeParse({ email, password });
    if (!parse.success) {
      setHasError(t("error", { defaultValue: "Invalid email or password format." }));
      setIsLoading(false);
      return;
    }

    try {
      console.log("[LoginForm] Attempting signIn...");
      const result = await signIn('credentials', {
        redirect: false,
        email: email,
        password: password,
        callbackUrl: callbackUrl
      });

      console.log("[LoginForm] signIn result:", result);

      if (result?.error) {
        console.error("[LoginForm] signIn error:", result.error);
        setHasError(t("error", { defaultValue: "Invalid credentials or server error." }));
        setIsLoading(false);
      } else if (result?.ok) {
        console.log("[LoginForm] signIn successful, redirecting to:", callbackUrl);
        router.push(callbackUrl);
      } else {
        console.error("[LoginForm] Unexpected signIn result:", result);
        setHasError(t("error", { defaultValue: "An unexpected error occurred." }));
        setIsLoading(false);
      }

    } catch (error) {
      console.error("[LoginForm] Exception during signIn:", error);
      setHasError(t("error", { defaultValue: "Login failed due to a network or server issue." }));
      setIsLoading(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-4 w-full max-w-md mx-auto bg-white/10 dark:bg-neutral-900/10 border border-gray-300 dark:border-neutral-700 shadow-[0_0_40px_0_#ffffff55] backdrop-blur-2xl rounded-2xl px-6 py-8 sm:px-8 sm:py-10"
      onSubmit={handleSubmit}
      autoComplete="off"
    >
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
          className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-gray-300 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary/70 text-gray-900 dark:text-gray-100 text-base sm:text-lg placeholder-gray-400"
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
            autoComplete="current-password"
            required
            className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/70 text-gray-900 dark:text-gray-100 pr-10 text-base sm:text-lg placeholder-gray-400"
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
        className="mt-2 px-6 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-black dark:text-white font-bold shadow-lg hover:scale-105 transition-transform border-2 border-primary/60 backdrop-blur-md disabled:opacity-60 text-base sm:text-lg"
      >
        {isLoading ? t("loading") : t("submit")}
      </button>
    </form>
  );
}
