"use client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { signOut } from "next-auth/react";

export function UserMenu() {
  const t = useTranslations("nav");
  const router = useRouter();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({ redirect: false });
    setIsLoading(false);
    router.push(`/${locale}/login`);
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="px-4 py-2 rounded-lg font-semibold text-[#ff00cc] hover:bg-[#232946]/60 transition-colors border border-[#ff00cc]/30"
    >
      {isLoading ? t("loading") : t("logout")}
    </button>
  );
}
