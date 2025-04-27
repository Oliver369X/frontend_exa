import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProjectList } from "@/components/projects/project-list";

export default async function ProjectsPage({ params }: { params: { locale: string } }) {
  // Next.js 14+ puede entregar params como promesa en ciertas configuraciones, así que mejor hacer:
  const awaitedParams = await params;
  const { locale } = awaitedParams;
  
  // Usar getServerSession
  const session = await getServerSession(authOptions); 

  // Verificar si existe la sesión
  if (!session) { 
    console.warn("[ProjectsPage Guard] No session found via getServerSession. Redirecting to login.");
    return redirect(`/${locale}/login`);
  }
  
  // Si la sesión existe, continuar
  console.log("[ProjectsPage Guard] Session found via getServerSession. Access granted.");
  const t = await getTranslations({ locale, namespace: "projects" });
  return (
    <main className="flex min-h-screen bg-white text-gray-900 dark:bg-neutral-950 dark:text-gray-100 transition-colors">
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 w-full max-w-4xl mx-auto gap-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 w-full">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
        <Card className="shadow-sm w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">{t("title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Aquí irá la lista de proyectos, asegúrate de que ProjectList use los estilos generales */}
            <ProjectList />
            {/* <div className="text-gray-500 dark:text-gray-400 text-center py-8">
              {t("table.empty")}
            </div> */}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
