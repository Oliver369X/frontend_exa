'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

// Importación dinámica para evitar problemas de SSR
const CodeEditor = dynamic(
  () => import('./editor/CodeEditor').then((mod) => mod.CodeEditor),
  { ssr: false }
);

const Terminal = dynamic(
  () => import('./terminal/Terminal').then((mod) => mod.Terminal),
  { ssr: false }
);

interface CodeWorkspaceProps {
  initialCode?: string;
  projectId: string;
  chatComponent?: React.ReactNode;
}

export function CodeWorkspace({ initialCode = '', projectId, chatComponent }: CodeWorkspaceProps) {
  const [code, setCode] = useState(initialCode);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showChat, setShowChat] = useState(true);
  
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
  };
  
  const toggleTerminal = () => {
    setShowTerminal(!showTerminal);
  };
  
  const toggleChat = () => {
    setShowChat(!showChat);
  };
  
  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="text-sm font-medium">Proyecto: {projectId}</div>
        <div className="flex space-x-2">
          <button 
            onClick={toggleTerminal}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            {showTerminal ? 'Ocultar Terminal' : 'Mostrar Terminal'}
          </button>
          <button 
            onClick={toggleChat}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            {showChat ? 'Ocultar Chat' : 'Mostrar Chat'}
          </button>
        </div>
      </div>
      
      <PanelGroup direction="horizontal" className="flex-grow">
        <Panel defaultSize={showChat ? 60 : 100} minSize={30}>
          <PanelGroup direction="vertical">
            <Panel 
              defaultSize={showTerminal ? 70 : 100} 
              minSize={30}
              className="overflow-hidden"
            >
              <CodeEditor 
                code={code} 
                onChange={handleCodeChange}
                language="typescript"
              />
            </Panel>
            
            {showTerminal && (
              <>
                <PanelResizeHandle className="h-2 bg-gray-700 hover:bg-blue-600 transition-colors" />
                <Panel defaultSize={30} minSize={20}>
                  <Terminal />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>
        
        {showChat && (
          <>
            <PanelResizeHandle className="w-2 bg-gray-700 hover:bg-blue-600 transition-colors" />
            <Panel defaultSize={40} minSize={30}>
              <div className="h-full overflow-auto bg-gray-800 p-4">
                {chatComponent || <div className="text-gray-400">Chat no disponible</div>}
              </div>
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}