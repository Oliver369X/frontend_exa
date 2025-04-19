import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';
import type { Metadata } from 'next';

const GrapesJSEditor = dynamic(() => import('@/components/grapesjs/grapesjs-editor'), {
  ssr: false,
});

interface Props {
  params: { id: string; locale: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale, namespace: 'projects' });
  return {
    title: t('collabLink.title', { defaultValue: 'Colaboración de proyecto' }),
  };
}

async function fetchProjectByLink(token: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/projects/link/${token}`);
    if (!res.ok) return { error: true };
    const data = await res.json();
    return { project: data.project, linkAccess: data.linkAccess };
  } catch {
    return { error: true };
  }
}

export default async function ProjectLinkPage({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: 'projects' });
  const { id } = params;

  // Fetch project and permission from backend
  const { project, linkAccess, error } = await fetchProjectByLink(id);

  if (error || !project || !linkAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <h1 className="text-2xl font-bold mb-4 text-destructive">{t('collabLink.invalid', { defaultValue: 'Enlace inválido o sin permisos.' })}</h1>
      </div>
    );
  }

  return (
    <main className="flex flex-col gap-4 py-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-2">{project.name}</h1>
      <div className="rounded border bg-muted p-4">
        <GrapesJSEditor
          content={project.content}
          readOnly={linkAccess === 'read'}
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {linkAccess === 'read'
          ? t('collabLink.readOnly', { defaultValue: 'Solo lectura. No puedes editar este proyecto.' })
          : t('collabLink.write', { defaultValue: 'Tienes permisos de edición.' })}
      </p>
    </main>
  );
}
