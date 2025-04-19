import { getToken } from "@/lib/auth-guard";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption
} from "@/components/ui/table";
import { SidebarClient } from "@/components/sidebar/sidebar-client";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  status: string;
}

export default async function DashboardPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "nav" });
  const tProjects = await getTranslations({ locale, namespace: "projects" });

  // SSR auth guard
  const token = getToken();
  if (!token) {
    return redirect(`/${locale}/login`);
  }

  // Fetch projects via API route (token in cookie)
  const projectsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/projects`, {
    headers: { Cookie: `token=${token}` },
    cache: "no-store",
  });
  let projects: Project[] = [];
  if (projectsRes.ok) {
    const data = await projectsRes.json();
    projects = data.projects || [];
  }

  return (
    <main className="flex min-h-screen bg-white text-gray-900 dark:bg-neutral-950 dark:text-gray-100 transition-colors">
      {/* Sidebar responsive con lógica client-side */}
      <SidebarClient
        locale={locale}
        dashboardLabel={t("dashboard")}
        projectsLabel={t("projects")}
      />
      {/* Contenido principal responsive */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-16 w-full max-w-4xl mx-auto gap-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 w-full">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>
        <Card className="shadow-sm w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">{tProjects("table.empty")}</div>
            ) : (
              <Table>
                <TableCaption>Proyectos recientes</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.name")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead>{t("table.createdAt")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.slice(0, 5).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.status}</TableCell>
                      <TableCell>{new Date(p.createdAt).toLocaleDateString(locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
