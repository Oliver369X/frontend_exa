"use client"; // Make it a client component

import { useState, useEffect } from "react"; // Import hooks
import { useRouter } from "next/navigation"; // Keep for potential future use
import { useSession } from "next-auth/react"; // Import useSession
import { getTranslations } from "next-intl/server"; // Keep for initial props or remove if fully client
import { useTranslations, useLocale } from "next-intl"; // Import client hook
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
import { getApiUrl } from "@/lib/api"; // Import getApiUrl

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  isArchived: boolean; // Assuming this exists based on schema
}

export default function DashboardPage() {
  // Use client-side hooks
  const t = useTranslations("nav"); 
  const tProjects = useTranslations("projects");
  const locale = useLocale();
  const router = useRouter(); // Keep router if needed for actions
  const { data: session, status: sessionStatus } = useSession(); // Use session hook

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch projects on the client side using useEffect
  useEffect(() => {
    // Only fetch if session is authenticated and token exists
    if (sessionStatus === 'authenticated' && session?.backendToken) {
      setIsLoading(true);
      const fetchProjects = async () => {
        try {
          const apiUrl = getApiUrl('/projects'); // Get backend URL
          console.log("[Dashboard] Fetching projects from:", apiUrl);
          const res = await fetch(apiUrl, {
            headers: { 
              Authorization: `Bearer ${session.backendToken}` // Use the correct token
            },
            cache: "no-store",
          });
          console.log("[Dashboard] Fetch response status:", res.status);
          if (!res.ok) {
             // Log error details if possible
            const errorText = await res.text().catch(() => 'Failed to get error text');
            console.error("[Dashboard] Fetch error:", res.status, res.statusText, errorText);
            throw new Error('Failed to fetch projects');
          }
          const data = await res.json();
          console.log("[Dashboard] Fetched projects:", data);
          // Assuming the API returns an array directly or { projects: [...] }
          setProjects(Array.isArray(data) ? data : data.projects || []);
        } catch (error) {
          console.error("[Dashboard] Error fetching projects:", error);
          setProjects([]); // Clear projects on error
          // Optionally show a toast error
        } finally {
          setIsLoading(false);
        }
      };
      fetchProjects();
    } else if (sessionStatus === 'loading') {
      // Keep loading if session is still loading
      setIsLoading(true);
    } else {
      // If session is unauthenticated, stop loading and clear projects
      setIsLoading(false);
      setProjects([]);
      // Redirect to login if unauthenticated after load?
      // if (sessionStatus === 'unauthenticated') router.push(`/${locale}/login`);
    }
  // Depend on session status and token
  }, [sessionStatus, session?.backendToken, locale, router]);

  // Handle Loading State
  if (isLoading || sessionStatus === 'loading') {
      return (
          <div className="flex justify-center items-center min-h-screen">
              <p>Loading Dashboard...</p> {/* Simple loading indicator */}
          </div>
      );
  }
  
  // Handle Unauthenticated State (Should ideally be caught by middleware/redirect)
   if (sessionStatus !== 'authenticated') {
       // This might briefly show if redirect hasn't happened yet
       return (
           <div className="flex justify-center items-center min-h-screen">
               <p>Redirecting to login...</p>
           </div>
       );
   }

  // Render the main dashboard content
  return (
    <main className="flex min-h-screen bg-white text-gray-900 dark:bg-neutral-950 dark:text-gray-100 transition-colors">
      <SidebarClient
        locale={locale}
        dashboardLabel={t("dashboard")}
        projectsLabel={t("projects")}
      />
      <section className="flex-1 flex flex-col items-center justify-start px-4 py-16 w-full max-w-4xl mx-auto gap-8 mt-10"> {/* Added mt-10 */} 
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 w-full">
          <h1 className="text-3xl font-bold">{t("dashboard")}</h1>
          {/* TODO: Add "Create Project" button here */}
        </div>
        <Card className="shadow-sm w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-bold">{t("recentActivity")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
               <p>Loading projects...</p> 
            ) : projects.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">{tProjects("table.empty")}</div>
            ) : (
              <Table>
                <TableCaption>{t("recentProjectsCaption")}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tProjects("table.name")}</TableHead>
                    <TableHead>{tProjects("table.status")}</TableHead>
                    <TableHead>{tProjects("table.createdAt")}</TableHead>
                    <TableHead>{tProjects("table.actions")}</TableHead> 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => router.push(`/${locale}/projects/${p.id}`)} title={tProjects("rowClickableTooltip")}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.isArchived ? tProjects("archived") : tProjects("active")}</TableCell>
                      <TableCell>{new Date(p.createdAt).toLocaleDateString(locale)}</TableCell>
                      <TableCell>{/* Add action buttons (Edit/Delete?) */}</TableCell>
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
