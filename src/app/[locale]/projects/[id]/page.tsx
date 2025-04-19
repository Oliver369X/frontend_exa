'use client';

import { ProjectPreview } from "@/components/projects/project-preview";
import { ClientPanel } from "./client-panel";
import { useEffect, useState } from "react";

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { id: projectId } = params;
  // Simulación: calcula isOwner (ajusta según tu lógica real de auth)
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    // Simula un fetch para determinar si el usuario es owner
    // Reemplaza esto por tu lógica real de autenticación
    setIsOwner(true); // Cambia a false para probar como no-owner
  }, [projectId]);

  return (
    <main className="flex min-h-screen bg-white text-gray-900 dark:bg-neutral-950 dark:text-gray-100 transition-colors">
      <section className="flex-1 flex flex-col items-start justify-start px-4 py-16 w-full max-w-5xl mx-auto gap-8">
        <h1 className="text-3xl font-bold mb-4">Proyecto</h1>
        <div className="grid md:grid-cols-3 gap-8 w-full">
          {/* Canvas central */}
          <div className="md:col-span-2">
            <ProjectPreview projectId={projectId} />
          </div>
          {/* Panel lateral */}
          <ClientPanel projectId={projectId} isOwner={isOwner} />
        </div>
      </section>
    </main>
  );
}