import { getToken } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function SettingsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  // Proteger ruta: si no hay JWT, redirigir a login
  const token = getToken();
  if (!token) {
    return redirect(`/${locale}/login`);
  }
  const t = await getTranslations({ locale, namespace: "nav" });
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      <h1 className="text-3xl font-bold text-[#fff200] mb-6">Settings</h1>
      <p className="text-white/80">{t("dashboard")}</p>
    </div>
  );
}
