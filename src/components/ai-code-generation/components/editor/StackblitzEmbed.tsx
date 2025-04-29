'use client';

import { useEffect, useState } from 'react';
import { CodeWorkspace } from '../CodeWorkspace';

interface StackblitzEmbedProps {
  projectId: string;
  generatedCode?: string;
  chatComponent?: React.ReactNode;
}

export function StackblitzEmbed({ projectId, generatedCode, chatComponent }: StackblitzEmbedProps) {
  // Extraer código de los bloques de código generados
  const extractCodeFromMarkdown = (markdown: string): string => {
    if (!markdown) return '';
    
    const codeBlockRegex = /```(?:typescript|html|css|json|scss|js|jsx|ts|tsx):([^\n]+)\n([\s\S]*?)```/g;
    let extractedCode = '';
    let match;
    
    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      const [, filePath, fileContent] = match;
      extractedCode += `// Archivo: ${filePath}\n${fileContent.trim()}\n\n`;
    }
    
    return extractedCode || (markdown || '');
  };
  
  const initialCode = generatedCode ? extractCodeFromMarkdown(generatedCode) : '';
  
  return (
    <div className="h-full w-full">
      <CodeWorkspace 
        initialCode={initialCode}
        projectId={projectId}
        chatComponent={chatComponent}
      />
    </div>
  );
}