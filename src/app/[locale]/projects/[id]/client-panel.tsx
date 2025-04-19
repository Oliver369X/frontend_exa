"use client";
import { ProjectVersionsPanel } from "@/components/projects/project-versions-panel";
import { ProjectCollaboratorsPanel } from "@/components/projects/project-collaborators-panel";
import { ProjectLinkAccessPanel } from "@/components/projects/project-link-access-panel";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface ClientPanelProps {
  projectId: string;
  isOwner: boolean;
}

export function ClientPanel({ projectId, isOwner }: ClientPanelProps) {
  const t = useTranslations("projects");
  const [linkAccess, setLinkAccess] = useState<"none" | "read" | "write">("none");
  const [linkToken, setLinkToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOwner) return;
    setIsLoading(true);
    fetch(`http://localhost:4000/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      cache: "no-store"
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("No se pudo cargar el proyecto");
        const data = await res.json();
        setLinkAccess(data.linkAccess ?? "none");
        setLinkToken(data.linkToken ?? "");
      })
      .finally(() => setIsLoading(false));
  }, [projectId, isOwner]);

  return (
    <div className="space-y-8">
      <ProjectVersionsPanel projectId={projectId} onRestore={(snapshot) => {
        alert(t("versionRestored") + ": " + JSON.stringify(snapshot));
      }} />
      <ProjectCollaboratorsPanel projectId={projectId} isOwner={isOwner} />
      {/* Siempre mostrar el panel de compartir, aunque no seas owner para debug. Puedes ajustar la lógica luego */}
      <div className="mt-4">
        <ProjectLinkAccessPanel
          projectId={projectId}
          initialAccess={linkAccess}
          initialToken={linkToken}
          isLoading={isLoading}
          t={t}
        />
      </div>
    </div>
  );
}
