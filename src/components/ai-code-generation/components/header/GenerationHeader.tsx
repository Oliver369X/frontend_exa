import { useState } from 'react';
import { ProviderStatusBadge } from '../status/ProviderStatusBadge';

interface GenerationHeaderProps {
  projectName: string;
}

export function GenerationHeader({ projectName }: GenerationHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`border-b bg-gray-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'h-12 overflow-hidden' : 'h-auto'}`}>
      <div className="p-4 flex justify-between items-center">
        {/* Contenido principal del header */}
        <div className={`flex-grow transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <h2 className="text-xl font-semibold">Generación de Código Angular</h2>
          <p className="text-gray-600">Proyecto: {projectName}</p>
        </div>

        {/* Contenido que siempre es visible (o se adapta) */}
        <div className="flex items-center gap-4 ml-4">
           {!isCollapsed && (
             <div className="flex items-center gap-2">
               <span className="text-sm text-gray-500">Estado:</span>
               <ProviderStatusBadge providerName="gemini" />
             </div>
           )}
          <button
            onClick={toggleCollapse}
            className="p-1 rounded hover:bg-gray-200"
            aria-label={isCollapsed ? "Expandir cabecera" : "Colapsar cabecera"}
          >
            {isCollapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <title>Expandir</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <title>Colapsar</title>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
       {/* Contenido que se oculta */}
       {!isCollapsed && (
         <div className="px-4 pb-4 transition-opacity duration-300">
           {/* Puedes añadir más detalles o controles aquí si es necesario */}
         </div>
       )}
    </div>
  );
}