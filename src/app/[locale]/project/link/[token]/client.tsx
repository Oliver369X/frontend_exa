"use client";

import { useState } from "react";

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

interface ProjectLinkClientProps {
  project: ProjectData;
  linkAccess: "read" | "write" | null;
  token: string;
  translations: {
    editAccess: string;
    viewAccess: string;
    sharedProject: string;
    aboutProject: string;
    projectEditor: string;
    collaborative: string;
    viewOnly: string;
  };
}

export function ProjectLinkClient({ 
  project, 
  linkAccess, 
  token, 
  translations 
}: ProjectLinkClientProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleEditorChange = async (html: string) => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      await fetch(`http://localhost:4000/projects/${project.id}/content`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Link-Token': token
        },
        body: JSON.stringify({ content: html })
      });
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
        {/* Header with project information and access type */}
        <header className="w-full flex items-center justify-between px-8 py-4 border-b border-neutral-800">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold truncate max-w-xs">{project.name}</h1>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
              {linkAccess === "write" ? translations.editAccess : translations.viewAccess}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm">{translations.sharedProject}</span>
            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white text-xs">
              {project.owner?.name?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* Main content with collaborative editor */}
        <section className="flex flex-1 w-full max-w-7xl mx-auto gap-8 px-4 py-8">
          <div className="flex-1 min-w-0 space-y-6">
            {/* Project description panel */}
            {project.description && (
              <div className="p-4 rounded-lg border border-border bg-card">
                <h2 className="text-lg font-medium mb-2">{translations.aboutProject}</h2>
                <p className="text-muted-foreground">{project.description}</p>
              </div>
            )}
            
            {/* Collaborative editor or read-only view */}
            <div className="border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/50 flex justify-between items-center">
                <h2 className="font-medium">{translations.projectEditor}</h2>
                <div className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                  {linkAccess === "write" ? translations.collaborative : translations.viewOnly}
                </div>
              </div>
              <div className="min-h-[500px]">
                <div className="p-4">
                  {linkAccess === "write" ? (
                    <div className="editor-simple">
                      <textarea
                        className="w-full h-96 p-4 border rounded-md"
                        defaultValue={project.content || `<h1>${project.name}</h1>`}
                        onChange={(e) => handleEditorChange(e.target.value)}
                      />
                      <div className="mt-4">
                        <button 
                          className="px-4 py-2 bg-primary text-white rounded-md"
                          onClick={() => handleEditorChange(document.querySelector('textarea')?.value || '')}
                        >
                          Guardar cambios
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="view-only" 
                      dangerouslySetInnerHTML={{ __html: project.content || `<h1>${project.name}</h1>` }}
                    />
                  )}
                  <style jsx>{`
                    .view-only, .editor-simple {
                      min-height: 400px;
                      padding: 15px;
                    }
                  `}</style>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}
