import React from "react";
import { useTranslations } from "next-intl";

/**
 * Componente para mostrar la vista previa del proyecto.
 * En el futuro, aquí se montará el editor GrapesJS completo.
 */
export function ProjectPreview({ projectId }: { projectId: string }) {
  const t = useTranslations("projects");
  // Por ahora, solo muestra un placeholder.
  // Más adelante, aquí irá el iframe o el wrapper de GrapesJS.
  return (
    <div className="w-full h-[600px] bg-gray-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center shadow">
      <span className="text-gray-400">
        {t("preview.placeholder", { defaultValue: "Vista previa del proyecto (GrapesJS aquí)" })}
      </span>
    </div>
  );
}
