import React from "react";
import { useTranslations } from "next-intl";
import { Navbar } from "@/components/nav/navbar";

export default function Home() {
  const t = useTranslations("landing");
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] overflow-hidden">
      <Navbar />
      {/* Glassmorphism Card con estilo cyberpunk */}
      <div className="relative z-10 max-w-2xl w-full mx-auto mt-32 mb-16 p-10 rounded-3xl bg-white/5 backdrop-blur-2xl border border-[#00fff7]/30 shadow-[0_0_40px_0_#00fff7aa]" style={{boxShadow: '0 0 60px 0 #00fff7cc, 0 0 120px 0 #ff00cc55'}}>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00fff7] via-[#ff00cc] to-[#fff200] drop-shadow-[0_0_14px_#00fff7] text-center">
          {t("title")}
        </h1>
        <p className="text-lg sm:text-xl text-[#e0e0e0] text-center max-w-xl font-medium">
          {t("description")}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="#comenzar"
            className="px-7 py-3 rounded-full bg-gradient-to-r from-[#ff00cc] via-[#333399] to-[#00fff7] text-black font-bold shadow-lg hover:scale-105 transition-transform border-2 border-[#00fff7]/60 backdrop-blur-md"
          >
            {t("cta_start")}
          </a>
          <a
            href="#features"
            className="px-7 py-3 rounded-full bg-[#232946]/80 text-[#00fff7] font-bold shadow-lg hover:bg-[#232946]/60 transition-colors border-2 border-[#ff00cc]/60"
          >
            {t("cta_features")}
          </a>
        </div>
      </div>
      {/* Gradientes y neones cyberpunk */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[420px] h-[420px] bg-gradient-radial from-[#00fff7]/60 to-transparent rounded-full blur-3xl opacity-80 animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[600px] h-[600px] bg-gradient-radial from-[#ff00cc]/50 to-transparent rounded-full blur-3xl opacity-70 animate-pulse" />
        <div className="absolute top-[30%] left-[50%] w-[180px] h-[180px] bg-gradient-radial from-[#fff200]/40 to-transparent rounded-full blur-2xl opacity-60 animate-pulse" />
      </div>
      {/* Sección de features */}
      <section id="features" className="relative z-10 w-full max-w-4xl mx-auto mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="bg-[#181826]/80 rounded-2xl p-6 backdrop-blur-md border border-[#00fff7]/30 shadow-[0_0_24px_0_#00fff7aa] flex flex-col items-center">
          <span className="text-3xl mb-2">🤖</span>
          <h2 className="text-xl font-semibold text-[#00fff7] mb-2">{t("feature_agents")}</h2>
          <p className="text-[#e0e0e0] text-sm text-center">{t("feature_agents_desc")}</p>
        </div>
        <div className="bg-[#181826]/80 rounded-2xl p-6 backdrop-blur-md border border-[#ff00cc]/30 shadow-[0_0_24px_0_#ff00ccaa] flex flex-col items-center">
          <span className="text-3xl mb-2">🔒</span>
          <h2 className="text-xl font-semibold text-[#ff00cc] mb-2">{t("feature_security")}</h2>
          <p className="text-[#e0e0e0] text-sm text-center">{t("feature_security_desc")}</p>
        </div>
        <div className="bg-[#181826]/80 rounded-2xl p-6 backdrop-blur-md border border-[#fff200]/30 shadow-[0_0_24px_0_#fff200aa] flex flex-col items-center">
          <span className="text-3xl mb-2">🚀</span>
          <h2 className="text-xl font-semibold text-[#fff200] mb-2">{t("feature_ux")}</h2>
          <p className="text-[#e0e0e0] text-sm text-center">{t("feature_ux_desc")}</p>
        </div>
      </section>
      {/* Footer */}
      <footer className="relative z-10 mt-20 mb-6 text-[#00fff7]/80 text-center text-sm">
        {t("footer")}
      </footer>
    </div>
  );
}
