"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProjectCollaboratorsPanel } from "./project-collaborators-panel";
import { useTranslations } from "next-intl";
import { Users } from 'lucide-react'; // Icono para el botón

interface CollaboratorManagerProps {
  projectId: string;
  isOwner: boolean;
}

export function CollaboratorManager({ projectId, isOwner }: CollaboratorManagerProps) {
  const t = useTranslations("projects.collaborators"); // Usar namespace más específico
  const [open, setOpen] = useState(false);

  // No mostrar nada si el usuario no es el propietario
  if (!isOwner) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" />
          {t("manageButton", { defaultValue: "Gestionar Colaboradores" })}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogTitle>{t("title", { defaultValue: "Colaboradores" })}</DialogTitle>
        <div className="py-4">
          {/* Renderiza el panel existente dentro del modal */}
          <ProjectCollaboratorsPanel projectId={projectId} isOwner={isOwner} />
        </div>
      </DialogContent>
    </Dialog>
  );
} 