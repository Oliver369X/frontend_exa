// Este archivo es ahora un Server Component (NO lleva 'use client')
import ProjectDetailServer from "./project-detail-server";

interface ProjectDetailPageProps {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  // Next.js 14+: params puede ser una promesa, así que asegúrate de await
  const awaitedParams = await params;
  const { id: projectId } = awaitedParams;
  return <ProjectDetailServer projectId={projectId} />;
}