'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '../components/chat/ChatInterface';
import { EnhancedStackblitzEmbed } from '../components/editor/EnhancedStackblitzEmbed';
import { GenerationHeader } from '../components/header/GenerationHeader';
import { useCodeGeneration } from '../hooks/useCodeGeneration';

interface ProjectData {
  id: string;
  name: string;
}

interface CodeGenerationPageProps {
  projectId: string;
  locale?: string; // Para compatibilidad con Next.js dinámico
}

export function CodeGenerationPage({ projectId }: CodeGenerationPageProps) {
  const [projectData, setProjectData] = useState<ProjectData>({ id: projectId, name: 'Proyecto Angular' });
  const [isLoading, setIsLoading] = useState(true);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const { messages, sendMessage, isGenerating, isProviderReady } = useCodeGeneration(projectId);
  
  useEffect(() => {
    // Cargar datos del proyecto
    const fetchProjectData = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          setProjectData({ id: projectId, name: `Proyecto Angular ${projectId.slice(0, 8)}` });
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        setProjectData(data);
      } catch (error) {
        console.error('Error al cargar datos del proyecto:', error);
        // Use a safe substring operation to prevent errors
        const safeId = projectId && typeof projectId === 'string' 
          ? projectId.slice(0, 8) 
          : 'default';
        setProjectData({ id: projectId, name: `Proyecto Angular ${safeId}` });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId]);
  
  const handleChatCollapseToggle = (collapsed: boolean) => {
    setIsChatCollapsed(collapsed);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Cargando datos del proyecto...</div>;
  }
  
  if (!isProviderReady) {
    return <div className="flex justify-center items-center h-screen">Inicializando el proveedor de IA...</div>;
  }
  
  // Obtener código generado del último mensaje de asistente
  const generatedCode = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content)
    .pop();
  
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <GenerationHeader projectName={projectData?.name || 'Proyecto'} />
      </div>
      
      {/* Botón flotante para mostrar chat cuando está colapsado */}
      {isChatCollapsed && (
        <button
          className="fixed left-4 bottom-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
          onClick={() => setIsChatCollapsed(false)}
          aria-label="Mostrar chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
      
      <div className="flex-grow flex overflow-hidden relative">
        {!isChatCollapsed && (
          <div className="w-1/3 md:w-1/4 border-r flex flex-col overflow-hidden">
            <ChatInterface 
              messages={messages} 
              onSendMessage={sendMessage} 
              isLoading={isGenerating} 
              onCollapseToggle={handleChatCollapseToggle}
            />
          </div>
        )}
        <div 
          className={`transition-all duration-300 flex-grow h-full ${isChatCollapsed ? 'w-full' : 'w-2/3 md:w-3/4'}`}
          style={{ height: 'calc(100vh - 60px)' }} // Ajustar altura para restar el header
        >
          <EnhancedStackblitzEmbed 
            projectId={projectId} 
            generatedCode={generatedCode} 
          />
        </div>
      </div>
    </div>
  );
}