import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface LinkPageProps {
  params: { locale: string; token: string };
}

export default async function ProjectLinkPage({ params }: LinkPageProps) {
  const { locale, token } = params;
  const t = await getTranslations({ locale, namespace: "projects" });

  // Llama al backend para validar el token y obtener el proyecto
  let project: any = null;
  let linkAccess: "read" | "write" | null = null;
  try {
    const res = await fetch(`http://localhost:4000/projects/link/${token}`);
    if (!res.ok) throw new Error("Not found");
    const data = await res.json();
    project = data.project;
    linkAccess = data.linkAccess;
  } catch {
    return notFound();
  }

  if (!project) return notFound();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-lg w-full p-8 rounded-xl shadow bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
        <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
        <p className="mb-4 text-gray-600 dark:text-gray-300">{project.description}</p>
        <div className="mb-4">
          <span className="font-semibold">{t("linkAccessTitle")}: </span>
          {linkAccess === "write"
            ? t("linkAccessWrite")
            : t("linkAccessRead")}
        </div>
        {/* Aquí puedes renderizar el contenido del proyecto según el permiso */}
        {linkAccess === "write" ? (
          <div className="p-4 bg-green-50 dark:bg-green-900/40 rounded-lg mb-2 text-green-900 dark:text-green-300">
            {t("linkWriteAccessMessage", { defaultValue: "Tienes permisos de edición en este proyecto." })}
          </div>
        ) : (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/40 rounded-lg mb-2 text-yellow-900 dark:text-yellow-300">
            {t("linkReadAccessMessage", { defaultValue: "Solo puedes ver este proyecto." })}
          </div>
        )}
        {/* Aquí podrías mostrar el editor visual o solo la vista de proyecto según el permiso */}
      </div>
    </main>
  );
}
