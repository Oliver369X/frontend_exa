"use client";


import { ProjectVersionsPanel } from "@/components/projects/project-versions-panel";
import { ProjectCollaboratorsPanel } from "@/components/projects/project-collaborators-panel";
import { ProjectLinkAccessPanel } from "@/components/projects/project-link-access-panel";
import { ClientPanel as ProjectClientPanel } from "@/components/projects/client-panel";
import { LinkAccessLevel } from "@/types/project";

interface ClientPanelProps {
  projectId: string;
  isOwner: boolean;
}

export function ClientPanel({ projectId, isOwner }: ClientPanelProps) {
  // Define dummy handlers for required props
  const handleRestore = () => {
    console.log('Restore version');
  };

  // Default values for required props
  const initialAccess: LinkAccessLevel = "none";
  const initialToken = "";
  
  return (
    <div className="space-y-8">
      {/* Main client panel with GrapesJS editor */}
      <ProjectClientPanel projectId={projectId} isOwner={isOwner} />
      
      {/* Project management panels */}
      {isOwner && (
        <>
          <ProjectVersionsPanel 
            projectId={projectId} 
            onRestore={handleRestore} 
          />
          <ProjectCollaboratorsPanel projectId={projectId} isOwner={isOwner} />
          <ProjectLinkAccessPanel 
            projectId={projectId} 
            initialAccess={initialAccess}
            initialToken={initialToken}
          />
        </>
      )}
    </div>
  );
}
