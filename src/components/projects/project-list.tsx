"use client";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { ProjectForm } from "./project-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption
} from "@/components/ui/table";
import { getClientToken } from "@/lib/auth-client";

type Project = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  isArchived?: boolean;
  status?: string;
};

export function ProjectList() {
  const t = useTranslations("projects");
  const locale = useLocale();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line
  }, []);

  async function fetchProjects() {
    setIsLoading(true);
    setHasError("");
    try {
      const token = getClientToken();
      const res = await fetch("http://localhost:4000/projects", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const debugText = await res.clone().text();
      console.log("[DEBUG] /projects status:", res.status, debugText);
      if (!res.ok) throw new Error("Error");
      let data;
      try {
        data = JSON.parse(debugText);
      } catch {
        data = [];
      }
      setProjects(
        (Array.isArray(data) ? data : data.projects || []).map((p: any) => ({
          ...p,
          description: p.description ?? "-",
          status: typeof p.isArchived === "boolean" ? (p.isArchived ? t("archived") : t("active")) : "N/A",
        }))
      );
    } catch {
      setHasError(t("error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteProject) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const token = getClientToken();
      const res = await fetch(`http://localhost:4000/projects/${deleteProject.id}` , {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Error");
      setProjects((prev) => prev.filter((p) => p.id !== deleteProject.id));
      setDeleteProject(null);
    } catch {
      setDeleteError(t("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  }

  function handleSuccess() {
    setShowForm(false);
    setEditProject(null);
    fetchProjects();
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h2>
        <Button onClick={() => { setShowForm(true); setEditProject(null); }}>{t("add")}</Button>
      </div>
      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-primary"><circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" /><path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          {t("rowClickable")}
        </span>
      </div>
      {hasError && <div className="text-red-500 text-center mb-2">{hasError}</div>}
      {isLoading ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">{t("loading")}</div>
      ) : (
        <Table>
          <TableCaption>{t("table.caption")}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.description")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.createdAt")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 dark:text-gray-400">
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            ) : (
              projects.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-primary/10 transition group" onClick={() => router.push(`/${locale}/projects/${p.id}`)} title={t("rowClickableTooltip")}> 
                  <TableCell className="font-medium group-hover:underline">{p.name}</TableCell>
                  <TableCell>{p.description}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell>{new Date(p.createdAt).toLocaleDateString(locale)}</TableCell>
                  <TableCell className="flex gap-2 justify-end" onClick={e => e.stopPropagation()}>
                    <Button size="icon" variant="outline" aria-label={t("edit")}
                      onClick={() => { setShowForm(true); setEditProject(p); }}>
                      ✏️
                    </Button>
                    <Button size="icon" variant="destructive" aria-label={t("delete")}
                      onClick={() => setDeleteProject(p)}>
                      🗑️
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
      {/* Modal para crear/editar proyecto */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-950 rounded-xl shadow-lg p-6 w-full max-w-md">
            <ProjectForm
              initialData={editProject || undefined}
              onSuccess={handleSuccess}
            />
            <Button variant="outline" className="mt-4 w-full" onClick={() => { setShowForm(false); setEditProject(null); }}>
              {t("cancel")}
            </Button>
          </div>
        </div>
      )}
      {/* Modal para eliminar proyecto */}
      {deleteProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-950 rounded-xl shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{t("deleteTitle")}</h3>
            <p className="mb-4 text-gray-700 dark:text-gray-300">{t("deleteConfirm", { name: deleteProject.name })}</p>
            {deleteError && <div className="text-red-500 text-center mb-2">{deleteError}</div>}
            <div className="flex gap-2 justify-end">
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? t("deleting") : t("delete")}
              </Button>
              <Button variant="outline" onClick={() => setDeleteProject(null)} disabled={isDeleting}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
