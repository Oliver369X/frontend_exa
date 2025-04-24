"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { getClientToken } from "@/lib/auth-client";
import { toast } from "react-hot-toast";

/**
 * Version type for project versions (design snapshots)
 */
export type ProjectVersion = {
  id: string;
  createdAt: string;
  createdById: string;
  comment?: string;
};

interface ProjectVersionsPanelProps {
  projectId: string;
}

export function ProjectVersionsPanel({ projectId }: ProjectVersionsPanelProps) {
  const t = useTranslations("projects");
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState("");
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions();
    // eslint-disable-next-line
  }, [projectId]);

  async function fetchVersions() {
    setIsLoading(true);
    setHasError("");
    try {
      const token = getClientToken();
      const res = await fetch(`http://localhost:4000/projects/${projectId}/versions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setVersions(Array.isArray(data) ? data : []);
    } catch {
      setHasError(t("versions.error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRestore(versionId: string) {
    setIsRestoring(versionId);
    setHasError("");
    try {
      const token = getClientToken();
      const res = await fetch(`http://localhost:4000/projects/${projectId}/versions/${versionId}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Error");
      const { snapshot } = await res.json();
      console.log("Snapshot recibido para restaurar (necesita implementación cliente):", snapshot);
      toast.info("Restauración iniciada (falta aplicar al editor)");
    } catch {
      setHasError(t("versions.restoreError"));
    } finally {
      setIsRestoring(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="font-semibold text-lg mb-2">{t("versions.title", { defaultValue: "Historial de versiones" })}</div>
      {isLoading ? (
        <div>{t("loading")}</div>
      ) : hasError ? (
        <div className="text-red-500">{hasError}</div>
      ) : (
        <ul className="divide-y divide-muted bg-muted rounded-lg">
          {versions.length === 0 && <li className="p-3 text-sm text-muted-foreground">{t("versions.empty", { defaultValue: "No hay versiones guardadas" })}</li>}
          {versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-mono text-xs text-muted-foreground">{new Date(v.createdAt).toLocaleString()}</div>
                <div className="text-sm font-medium">{v.comment || t("versions.noComment", { defaultValue: "Sin comentario" })}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={isRestoring === v.id}
                onClick={() => handleRestore(v.id)}
              >
                {isRestoring === v.id ? t("versions.restoring") : t("versions.restore")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
