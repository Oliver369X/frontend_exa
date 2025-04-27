import { ClientPanel as EditorClientPanel } from "@/components/projects/client-panel"; // Renombrado para claridad
import { CollaboratorManager } from "@/components/projects/collaborator-manager"; // Importar el nuevo componente
// import { LinkAccessLevel } from "@/types/project"; // ELIMINADO - No usado y causaba error
import { getServerSession } from "next-auth/next"; // Importar getServerSession
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // Importar authOptions
import { getApiUrl } from "@/lib/api"; // Para construir URL de API
import Link from 'next/link'; // Para el botón de Atrás
import { Button } from '@/components/ui/button'; // Para los nuevos botones
import { Bot } from 'lucide-react'; // Iconos - Eliminados ArrowLeft, Download
// import { headers } from 'next/headers'; // ELIMINADO - No usado
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
// import { getI18n } from '@/i18n/server'; // ELIMINADO - Usamos next-intl
import { getTranslations } from 'next-intl/server'; // CORREGIDO - Importar getTranslations de next-intl

interface ProjectData {
  id: string;
  name: string;
  // Añade otros campos si los necesitas mostrar
}

interface ProjectDetailServerProps {
  projectId: string;
  locale: string; // Añadir locale como prop
}

/**
 * Server Component: Recibe el projectId, obtiene datos del proyecto,
 * y renderiza el editor y la barra de herramientas superior.
 */
export default async function ProjectDetailServer({ projectId, locale }: ProjectDetailServerProps) {
  // const token = await getToken(); // Ya no usamos getToken
  const session = await getServerSession(authOptions); // Usar getServerSession
  console.log("[Server Session Check] Session from getServerSession():", JSON.stringify(session, null, 2)); // Log de la sesión
  let project: ProjectData | null = null;
  let fetchError = false;

  // Fetch de datos del proyecto en el servidor
  // Usar session?.backendToken
  if (session && session.backendToken) {
    try {
      const apiUrl = getApiUrl(`/projects/${projectId}`);
      console.log(`[Server Fetch] Fetching project: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${session.backendToken}` }, // Usar session.backendToken
        cache: 'no-store', // No cachear para asegurar datos frescos
      });
      console.log(`[Server Fetch] Response status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.status}`);
      }
      project = await response.json();
    } catch (error) {
      console.error("[Server Fetch] Error fetching project:", error);
      fetchError = true;
      // Podríamos redirigir o mostrar un mensaje de error más específico aquí
    }
  }

  // Determina si el usuario es owner (simulado aquí, reemplaza con tu lógica real)
  // Idealmente, esto vendría de la sesión o del fetch del proyecto
  const isOwner = true; // TODO: Reemplaza por lógica real de auth

  // Si hubo un error de fetch severo o no hay proyecto
  if (fetchError || !project) {
    return (
      <main className="min-h-screen flex items-center justify-center text-red-500">
        Error al cargar el proyecto.
      </main>
    );
  }

  // const { t } = await getI18n(); // ELIMINADO
  const t = await getTranslations({ locale }); // Obtener función t con getTranslations y locale

  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-neutral-950 dark:text-gray-100 transition-colors flex flex-col">
      {/* Barra Superior */}
      <div className="flex items-center justify-between p-3 md:p-4 border-b border-border flex-wrap gap-2">
        {/* Izquierda: Atrás y Título */}
        <div className="flex items-center gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/projects">{t('projects.title')}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-xl md:text-2xl font-semibold truncate" title={project.name}>
            {project.name}
          </h1>
        </div>

        {/* Derecha: Controles (Solo si es owner) */}
        {isOwner && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="default" disabled> {/* CORREGIDO - size="default" */}
              <Bot className="mr-2 h-4 w-4" />
              Generar Código
            </Button>
            <CollaboratorManager projectId={projectId} isOwner={isOwner} />
          </div>
        )}
      </div>

      {/* Área Principal (Editor) */}
      <div className="flex-grow p-4 md:p-6 lg:p-8 flex flex-col">
        {/* Renderizamos directamente el panel del editor */}
        <EditorClientPanel projectId={projectId} isOwner={isOwner} />
      </div>

      {/* Sidebar eliminado */}
    </main>
  );
}
