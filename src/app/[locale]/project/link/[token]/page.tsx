import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ProjectLinkClient } from "./client";
import { getApiUrl } from '../../../../../lib/api-config';

interface LinkPageProps {
  params: { locale: string; token: string };
}

export default async function ProjectLinkPage({ params }: LinkPageProps) {
  const { locale, token } = params;
  const t = await getTranslations({ locale, namespace: "projects" });

  // Llama al backend para validar el token y obtener el proyecto
  interface ProjectData {
    id: string;
    name: string;
    description?: string;
    content?: string;
    owner?: {
      id: string;
      name: string;
    };
  }
  
  let project: ProjectData | null = null;
  let linkAccess: "read" | "write" | null = null;
  try {
    const res = await fetch(getApiUrl(`/projects/link/${token}`));
    if (!res.ok) throw new Error("Not found");
    const data = await res.json();
    project = data.project;
    linkAccess = data.linkAccess;
  } catch {
    return notFound();
  }

  if (!project) return notFound();

  // Pass the data to the client component
  return (
    <ProjectLinkClient 
      project={project} 
      linkAccess={linkAccess} 
      token={token} 
      translations={{
        editAccess: t("shared.edit_access"),
        viewAccess: t("shared.view_access"),
        sharedProject: t("shared.shared_project"),
        aboutProject: t("shared.about_project"),
        projectEditor: t("shared.project_editor"),
        collaborative: t("shared.collaborative"),
        viewOnly: t("shared.view_only")
      }}
    />
  );
}
