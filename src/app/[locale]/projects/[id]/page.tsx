// Este archivo es ahora un Server Component (NO lleva 'use client')
import ProjectDetailServer from "./project-detail-server";

import Link from 'next/link';

interface ProjectDetailPageProps {
  params: { id: string; locale: string } | Promise<{ id: string; locale: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  // Next.js 14+: params puede ser una promesa, así que asegúrate de await
  const awaitedParams = await params;
  const { id: projectId } = awaitedParams;
  
  return (
    <div>
      <ProjectDetailServer projectId={projectId} />
      
      <div className="mt-6">
        <Link 
          href={`/${awaitedParams.locale}/projects/${projectId}/generate-code`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" 
            />
          </svg>
          Generar Código con IA
        </Link>
      </div>
    </div>
  );
}