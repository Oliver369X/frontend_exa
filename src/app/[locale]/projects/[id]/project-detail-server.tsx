import { ClientPanel } from "./client-panel";

interface ProjectDetailServerProps {
  projectId: string;
}

/**
 * Server Component: Recibe el projectId y renderiza los componentes hijos.
 * Pasa projectId como prop a los Client Components.
 */
export default function ProjectDetailServer({ projectId }: ProjectDetailServerProps) {
  // Aquí podrías hacer fetch de datos del proyecto si es necesario (SSR)
  // Determina si el usuario es owner (simulado aquí, reemplaza con tu lógica real)
  const isOwner = true; // TODO: Reemplaza por lógica real de auth
  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-neutral-950 dark:text-gray-100 transition-colors">
      <ClientPanel projectId={projectId} isOwner={isOwner} />
      <section className="flex-1 flex flex-col items-start justify-start px-4 py-16 w-full max-w-5xl mx-auto gap-8">
        <h1 className="text-3xl font-bold mb-4">Proyecto</h1>
        <div className="grid md:grid-cols-3 gap-8 w-full">
          {/* Editor colaborativo ocupa el canvas central (UX consistente, solo uno) */}
          <div className="">
          </div>
        </div>
      </section>
    </main>
  );
}
