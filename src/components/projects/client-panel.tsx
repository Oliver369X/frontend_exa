"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useSession } from 'next-auth/react';
import { SimpleGrapesJSEditor } from '@/components/grapesjs';
import { useSocketContext } from "@/components/socket";
import type { SimpleGrapesEditorHandle } from "@/components/grapesjs/simple-editor";

// Interfaz más específica para designData (ejemplo, ajustar según necesidad)
interface GrapesJSComponent {
  // Definir propiedades esperadas de un componente GrapesJS si se conocen
  // Ejemplo:
  type?: string;
  content?: string;
  components?: GrapesJSComponent[];
  attributes?: Record<string, unknown>;
  [key: string]: unknown; // Permitir otras propiedades por ahora
}
interface ProjectDesignData {
  components?: GrapesJSComponent[]; // Usar la interfaz definida
  styles?: string;
}

// Tipo ProjectData actualizado
interface ProjectData {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  isArchived: boolean;
  designData?: ProjectDesignData | null; // Usar interfaz específica
  lockedById?: string | null;
  lockedAt?: Date | null;
  linkAccess: "none" | "read" | "write";
  linkToken?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ClientPanelProps {
  projectId: string;
  isOwner: boolean;
  linkAccessFromLink?: "none" | "read" | "write";
}

export function ClientPanel({ projectId, isOwner, linkAccessFromLink }: ClientPanelProps) {
  const t = useTranslations("projects");
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [effectiveAccess, setEffectiveAccess] = useState<"none" | "read" | "write">("none");
  const { data: session, status: sessionStatus } = useSession();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { emit, on, off, isConnected, joinProject } = useSocketContext();
  const editorComponentRef = useRef<SimpleGrapesEditorHandle>(null);
  const isApplyingRemoteUpdateRef = useRef(false);

  // Load project data when session is available
  useEffect(() => {
    console.log("[ClientPanel Effect] Status:", sessionStatus, "HasToken:", !!session?.backendToken);

    // 1. Si la sesión está cargando, esperar y mantener isLoading
    if (sessionStatus === 'loading') {
      console.log("[ClientPanel Effect] Session loading...");
      setIsLoading(true);
      return;
    }

    // 2. Si la sesión no está autenticada, no hacer nada y asegurar isLoading es false
    if (sessionStatus !== 'authenticated') {
      console.log("[ClientPanel Effect] Session not authenticated.");
      setIsLoading(false);
      setProjectData(null);
      setEffectiveAccess("none");
      return;
    }

    // 3. Si la sesión está autenticada PERO falta el token del backend (error de login/callback?)
    if (!session?.backendToken) {
      console.error("[ClientPanel Effect] Authenticated but backendToken is missing!");
      setIsLoading(false); // Dejar de cargar, no podemos hacer fetch
      setProjectData(null);
      setEffectiveAccess("none");
      // Consider showing a specific error message here?
      toast.error("Error de autenticación interna. Intente re-iniciar sesión.");
      return;
    }

    // 4. Si autenticado y con token, proceder a cargar datos
    console.log("[ClientPanel Effect] Session authenticated with token, loading project data...");
    const loadProjectData = async () => {
      // setIsLoading(true); // isLoading ya es true o se puso en el paso 1
      try {
        // Obtener la URL base directamente de las variables de entorno
        const baseApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
        console.log(`[ClientPanel Effect] Fetching: ${baseApiUrl}/projects/${projectId}`);
        // Usar la URL base directamente
        console.log("[ClientPanel Effect] Debug - Base API URL:", baseApiUrl, "Project ID:", projectId);
        const response = await fetch(`${baseApiUrl}/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${session.backendToken}` },
          cache: "no-store"
        });
        console.log("[ClientPanel Effect] Fetch status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Try to get error details
          console.error("API Error:", response.status, errorData);
          throw new Error(`Failed to load project: ${response.statusText}`);
        }
        
        const data: ProjectData = await response.json();
        console.log("[ClientPanel Effect] Project data loaded:", data);
        setProjectData(data); // Store the full project data

        // Determine effective access based on ownership and fetched linkAccess
        const access = isOwner ? "write" : (linkAccessFromLink ?? data.linkAccess ?? "none");
        setEffectiveAccess(access);
        console.log("[ClientPanel Effect] Effective access set to:", access);

        // toast.success(t("projectLoaded", { defaultValue: "Project loaded successfully" })); // Quizás no necesario si la UI carga
      } catch (error: unknown) {
        console.error("Error loading project:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        toast.error(t("loadError", { defaultValue: `Error loading project: ${errorMessage}` }));
        setProjectData(null); // Clear data on error
        setEffectiveAccess("none");
      } finally {
        console.log("[ClientPanel Effect] Setting isLoading to false.");
        setIsLoading(false); // Set loading false SOLO al final del proceso de carga
      }
    };

    loadProjectData();

  // Update dependency array
  }, [projectId, linkAccessFromLink, isOwner, sessionStatus, session?.backendToken, t]);

  // Debounced save function using useCallback
  const debouncedSave = useCallback(async (components: GrapesJSComponent[] | undefined, styles: string) => {
    if (!session?.backendToken || !projectData) return;

    setIsSaving(true);
    // Asegurarse que components no sea undefined al guardar
    const designDataToSave: ProjectDesignData = { components: components ?? [], styles };
    const savingToastId = toast.loading(t("savingChanges", { defaultValue: "Saving changes..." }));

    try {
      const baseApiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${baseApiUrl}/projects/${projectData.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.backendToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ designData: designDataToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Save API Error:", response.status, errorData);
        throw new Error(`Failed to save project: ${response.statusText}`);
      }
      toast.success(t("changesSaved", { defaultValue: "Changes saved" }), { id: savingToastId });

    } catch (error: unknown) {
      console.error("Error saving project:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(t("saveError", { defaultValue: `Error saving changes: ${errorMessage}` }), { id: savingToastId });
    } finally {
      setIsSaving(false);
    }

    // 2. Emitir Estado Completo (Siempre)
    if (isConnected) {
        if (isApplyingRemoteUpdateRef.current) {
            console.log('[ClientPanel DebouncedSave] Skipping emit because isApplyingRemoteUpdateRef is true.');
            return; 
        }
        console.log(`[ClientPanel DebouncedSave] Emitting editor:full-update. Connected: ${isConnected}`);
        emit('editor:full-update', designDataToSave);
    } else {
        console.warn('[ClientPanel DebouncedSave] Cannot emit full-update: Socket not connected.');
    }
  }, [session?.backendToken, projectData, isConnected, emit, t]);

  // onChange handler for the editor - NOW HANDLES DELTAS
  const handleEditorChange = useCallback(() => {
    if (isApplyingRemoteUpdateRef.current) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const editor = editorComponentRef.current?.getEditorInstance();
      if (!editor) return; 
      const currentComponents = editor.getComponents().toJSON(); 
      const currentStyles = editor.getCss(); 
      debouncedSave(currentComponents as GrapesJSComponent[] | undefined, currentStyles ?? ''); 
    }, 1500);
  }, [debouncedSave]);

  // Effect for joining/leaving socket room and listening for deltas
  useEffect(() => {
    if (projectId) { 
        console.log('[ClientPanel Socket Effect] Running for ProjectId:', projectId);
        joinProject(projectId); 

        // Listener para FULL UPDATES (Aplicado por TODOS excepto el emisor)
        const handleIncomingFullUpdate = (update: { userId: string; userName: string; data: ProjectDesignData }) => {
            console.log(`[ClientPanel Socket] Received editor:full-update from ${update.userName}. Applying...`); 
            const editor = editorComponentRef.current?.getEditorInstance();
            if (!editor || (session?.user?.id && update.userId === session.user.id)) {
                 console.log('[ClientPanel Socket] Skipping self-update or editor not ready.');
                 return;
            }
            
            isApplyingRemoteUpdateRef.current = true;
            try {
                if (update.data.components) {
                    editor.setComponents(update.data.components);
                }
                editor.setStyle(update.data.styles ?? ''); 
            } catch(error: unknown) {
                 console.error('[ClientPanel Socket Apply Full] Error applying full update:', error);
                 const message = error instanceof Error ? error.message : String(error);
                 toast.error(`Error applying update: ${message}`);
            } finally {
                isApplyingRemoteUpdateRef.current = false;
            }
        };
        
        console.log('[ClientPanel Socket] Attaching listeners...');
        on('editor:full-update', handleIncomingFullUpdate);

        return () => {
          console.log('[ClientPanel Socket] Cleanup: Detaching listeners for:', projectId);
          off('editor:full-update'); 
        };
    } else {
      console.log('[ClientPanel Socket Effect] Conditions not met (projectId missing).');
    }
    // Actualizadas dependencias
  }, [projectId, joinProject, on, off, session?.user?.id]); 

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  console.log("[ClientPanel Render] Status:", sessionStatus, "IsLoading:", isLoading, "HasData:", !!projectData, "HasToken:", !!session?.backendToken);

  // 1. Sesión cargando (cubre el estado inicial)
  if (sessionStatus === 'loading') {
    console.log("[ClientPanel Render] Rendering: Session Loading");
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>{t('loadingProject', { defaultValue: 'Loading session...' })}</p>
      </div>
    );
  }

  // 2. Sesión NO autenticada (después de cargar)
  if (sessionStatus !== 'authenticated') {
     console.log("[ClientPanel Render] Rendering: Not Authenticated");
     return (
      <div className="flex justify-center items-center min-h-[400px] text-orange-500">
        <p>{t('notAuthenticated', { defaultValue: 'Authentication required.' })}</p>
      </div>
    );
   }

  // 3. Autenticado, PERO AÚN cargando datos del proyecto
  if (isLoading) {
     console.log("[ClientPanel Render] Rendering: Project Data Loading");
     return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p>{t('loadingProject', { defaultValue: 'Loading project data...' })}</p>
      </div>
    );
  }

  // 4. Autenticado, carga finalizada, PERO falló la carga de datos (o falta token post-auth?)
  if (!projectData) {
     console.log("[ClientPanel Render] Rendering: Load Error or Missing Token Post-Auth");
     return (
      <div className="flex justify-center items-center min-h-[400px] text-red-500">
        {/* Podríamos diferenciar el mensaje si !session?.backendToken aquí, pero el useEffect ya lo manejó */}
        <p>{t('loadError', { defaultValue: 'Error loading project data or authentication issue.' })}</p>
      </div>
    );
  }

 // 5. ¡Todo bien! Renderizar contenido
 console.log("[ClientPanel Render] Rendering: Main Content");

  const designData = projectData.designData;
  const initialEditorContent = designData 
      ? { ...designData, styles: designData.styles ?? undefined } 
      : { components: [], styles: undefined }; // Default si no hay designData
      
  const readOnlyDefaultHtml = "<h1>Project Preview</h1><p>No content saved yet.</p>";
  const readOnlyContent = designData 
      ? { ...designData, styles: designData.styles ?? undefined } 
      : readOnlyDefaultHtml;
  const canEdit = effectiveAccess === 'write';

  return (
    <div className="space-y-8">
      {/* Add Saving Indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse">
          {t('savingChanges', { defaultValue: 'Saving...' })}
        </div>
      )}
      
      {/* GrapesJS Editor or Preview */}
      <div className="relative border rounded bg-muted p-4 group">
        {canEdit ? (
          <div className="min-h-[600px]"> {/* Increased min height */}
            <SimpleGrapesJSEditor
              ref={editorComponentRef}
              projectId={projectId}
              initialContent={initialEditorContent}
              readOnly={false}
              onChange={handleEditorChange}
            />
          </div>
        ) : (
          <div className="min-h-[600px] relative"> {/* Increased min height */}
            {/* Read-only editor needs careful handling of content type */}
            <SimpleGrapesJSEditor
              ref={editorComponentRef}
              projectId={projectId}
              initialContent={readOnlyContent}
              readOnly={true}
            />
            
            {/* Read-only indicator */}
            <div className="absolute top-2 right-2 bg-yellow-500/90 text-white px-2 py-1 text-xs rounded">
              {t("readOnlyMode", { defaultValue: "Read-only mode" })}
            </div>
          </div>
        )}
      </div>

      {/* Project information */}
      <div className="p-4 border rounded">
        <h2 className="text-lg font-medium mb-2">{t("projectInfo", { defaultValue: "Project Information" })}</h2>
        <div className="space-y-2">
          <p><strong>{t("projectId", { defaultValue: "Project ID" })}:</strong> {projectData.id}</p>
          <p><strong>{t("projectName", { defaultValue: "Project Name" })}:</strong> {projectData.name}</p>
          <p><strong>{t("accessLevel", { defaultValue: "Access Level" })}:</strong> {effectiveAccess}</p>
          <p><strong>{t("owner", { defaultValue: "Owner" })}:</strong> {isOwner ? t("yes", { defaultValue: "Yes" }) : t("no", { defaultValue: "No" })}</p>
        </div>
      </div>
    </div>
  );
}

export default ClientPanel;