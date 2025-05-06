'use client';

import { useEffect, useRef, useState } from 'react';
import sdk from '@stackblitz/sdk';
import type { VM, Project, EmbedOptions } from '@stackblitz/sdk';


interface EnhancedStackblitzEmbedProps {
  projectId: string;
  generatedCode?: string;
}

// Define los tipos necesarios para el filesystem de StackBlitz
interface StackBlitzFs {
  [path: string]: string | { directory: boolean };
}

export function EnhancedStackblitzEmbed({ projectId, generatedCode }: EnhancedStackblitzEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vmRef = useRef<VM | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFallbackView, setShowFallbackView] = useState(false);
  const lastCodeRef = useRef<string | undefined>(undefined);
  
  // Crear y embeber el proyecto de StackBlitz
  useEffect(() => {
    if (showFallbackView) return;

    const setupProject = async () => {
      if (!containerRef.current) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Limpiar contenedor existente
        containerRef.current.innerHTML = '';

        // Proyecto mínimo para Angular - Asegurar que projectId es válido
        const safeProjectId = projectId && typeof projectId === 'string' 
          ? projectId.slice(0, 8) 
          : 'angular-app';
        
        // Proyecto mínimo para Angular
        const simpleProject: Project = {
          title: `Angular App - ${safeProjectId}`,
          description: 'Angular Simplified App',
          template: 'angular-cli',
          files: {
            'src/app/app.component.ts': `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>¡Proyecto Angular creado!</h1>
      <p>Usa el chat para generar código.</p>
    </div>
  \`,
  styles: [\`
    h1 { color: #3f51b5; }
    p { color: #666; }
  \`]
})
export class AppComponent {
  title = 'Angular App';
}
`
          }
        };
        
        // Si hay código generado, actualizar el proyecto
        if (generatedCode) {
          try {
            // Extraer bloques de código con formato ```typescript:path/to/file.ts
            const codeBlockRegex = /```(?:typescript|html|css|json|scss|js|jsx|ts|tsx):([^\n]+)\n([\s\S]*?)```/g;
            let match;
            
            while ((match = codeBlockRegex.exec(generatedCode)) !== null) {
              const [, filePath, fileContent] = match;
              if (filePath && fileContent) {
                simpleProject.files[filePath.trim()] = fileContent.trim();
              }
            }
          } catch (err) {
            console.warn('Error al procesar código generado:', err);
          }
        }
        
        // Embeber el proyecto directamente en la página
        try {
          // Opciones para el proyecto embebido
          const options: EmbedOptions = {
            openFile: 'src/app/app.component.ts',
            hideNavigation: false,
            height: '100%',
            theme: 'dark',  // Tema oscuro para mejor legibilidad
            clickToLoad: false,
            forceEmbedLayout: true
          };
          
          // Crear el iframe embebido
          const vm = await sdk.embedProject(containerRef.current, simpleProject, options);
          vmRef.current = vm;
          
          // Intentar aplicar tema oscuro para mejor legibilidad si está disponible
          try {
            if (vm && vm.editor) {
              vm.editor.setTheme('dark');
            }
          } catch (err) {
            console.warn('No se pudo configurar el tema:', err);
          }

          setIsLoading(false);
          
          // Guardar el código actual como referencia
          lastCodeRef.current = generatedCode;
        } catch (error) {
          console.error('Error al embeber StackBlitz:', error);
          setShowFallbackView(true);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error general:', error);
        setError(`Error: ${error}`);
        setIsLoading(false);
        setShowFallbackView(true);
      }
    };

    setupProject();
    
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      vmRef.current = null;
    };
  }, [projectId, showFallbackView]);
  
  // Efecto separado para actualizar el editor cuando cambia el código generado
  useEffect(() => {
    // Si no hay VM, no hay editor que actualizar
    if (!vmRef.current || !generatedCode || generatedCode === lastCodeRef.current) {
      return;
    }
    
    // Función para actualizar archivos en el editor existente
    const updateEditorFiles = async () => {
      try {
        const vm = vmRef.current;
        if (!vm) return;
        
        // Extraer bloques de código con formato ```typescript:path/to/file.ts
        const codeBlockRegex = /```(?:typescript|html|css|json|scss|js|jsx|ts|tsx):([^\n]+)\n([\s\S]*?)```/g;
        let match;
        let updatedFiles = false;
        
        // Crear un objeto que contiene todos los archivos a crear
        const filesToCreate: Record<string, string> = {};
        
        while ((match = codeBlockRegex.exec(generatedCode)) !== null) {
          const [, filePath, fileContent] = match;
          if (filePath && fileContent) {
            // Agregar el archivo a la lista para crear
            filesToCreate[filePath.trim()] = fileContent.trim();
            
            // Verificar si necesitamos crear directorios
            const pathParts = filePath.trim().split('/');
            pathParts.pop(); // Eliminar el nombre del archivo
            if (pathParts.length > 0) {
              const directory = pathParts.join('/');
              console.log('Se usará el directorio:', directory);
            }
          }
        }
        
        // Aplicar todos los cambios de una sola vez si es posible
        if (Object.keys(filesToCreate).length > 0) {
          try {
            // Usar la API de FS para crear los archivos
            const fsDiff = {
              create: filesToCreate,
              destroy: [] // No eliminamos archivos
            };
            
            await vm.applyFsDiff(fsDiff);
            console.log('Archivos actualizados en el editor');
            updatedFiles = true;
          } catch (error) {
            console.error('Error al aplicar cambios al filesystem:', error);
            
            // Alternativa: intentar crear archivos individualmente
            try {
              for (const [path, content] of Object.entries(filesToCreate)) {
                try {
                  // @ts-ignore - Algunos entornos de StackBlitz tienen un método fs.writeFile
                  await vm.fs.writeFile(path, content);
                  console.log(`Creado archivo ${path}`);
                  updatedFiles = true;
                } catch (err) {
                  console.error(`No se pudo crear ${path}:`, err);
                }
              }
            } catch (e) {
              console.error('Falló el intento alternativo de crear archivos');
            }
          }
        }
        
        // Si se actualizaron archivos, abrir el primero que se modificó
        if (updatedFiles && vm && vm.editor) {
          try {
            const firstBlockMatch = generatedCode.match(codeBlockRegex);
            if (firstBlockMatch && firstBlockMatch[0]) {
              const firstFilePathMatch = firstBlockMatch[0].match(/```(?:.*?):([^\n]+)/);
              if (firstFilePathMatch && firstFilePathMatch[1]) {
                const firstFilePath = firstFilePathMatch[1].trim();
                vm.editor.openFile(firstFilePath);
              }
            }
          } catch (error) {
            console.warn('No se pudo abrir el archivo:', error);
          }
        }
        
        // Actualizar referencia del último código
        lastCodeRef.current = generatedCode;
      } catch (error) {
        console.error('Error al actualizar archivos en el editor:', error);
      }
    };
    
    // Actualizar los archivos en el editor
    updateEditorFiles();
    
  }, [generatedCode]);

  // Si hay error, mostrar una vista alternativa
  useEffect(() => {
    if (error || showFallbackView) {
      renderFallbackView();
    }
  }, [error, showFallbackView, generatedCode]);

  // Función para mostrar una vista alternativa
  const renderFallbackView = () => {
    if (!containerRef.current) return;
    
    containerRef.current.innerHTML = '';
    
    const fallbackView = document.createElement('div');
    fallbackView.className = 'flex flex-col h-full bg-white';
    
    const header = document.createElement('div');
    header.className = 'bg-amber-50 p-4 border-b border-amber-200';
    header.innerHTML = `
      <div class="flex items-center">
        <svg class="w-6 h-6 text-amber-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="font-medium">El editor no pudo cargarse. Puedes ver el código generado a continuación.</span>
      </div>
    `;
    
    const content = document.createElement('div');
    content.className = 'flex-1 p-4 overflow-auto';
    
    if (generatedCode) {
      content.innerHTML = `
        <div class="mb-4 flex justify-between items-center">
          <h2 class="text-lg font-semibold">Código Angular Generado</h2>
          <button id="fallback-copy-btn" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">Copiar todo</button>
        </div>
        <pre class="bg-gray-50 p-4 rounded-lg border text-sm font-mono overflow-auto">${generatedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      `;
    } else {
      content.innerHTML = `
        <div class="flex items-center justify-center h-full">
          <div class="text-center">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <h3 class="mt-2 text-sm font-medium text-gray-900">No hay código para visualizar</h3>
            <p class="mt-1 text-sm text-gray-500">Genera código primero usando la IA.</p>
          </div>
        </div>
      `;
    }
    
    // Botón para reintentar la carga del editor
    const retryButtonContainer = document.createElement('div');
    retryButtonContainer.className = 'mt-4 text-center';
    retryButtonContainer.innerHTML = `
      <button id="retry-editor-btn" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Reintentar cargar el editor
      </button>
    `;
    content.appendChild(retryButtonContainer);
    
    fallbackView.appendChild(header);
    fallbackView.appendChild(content);
    containerRef.current.appendChild(fallbackView);
    
    // Agregar funcionalidad a los botones
    setTimeout(() => {
      const copyBtn = document.getElementById('fallback-copy-btn');
      if (copyBtn && generatedCode) {
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(generatedCode);
          copyBtn.textContent = 'Copiado!';
          setTimeout(() => {
            copyBtn.textContent = 'Copiar todo';
          }, 2000);
        });
      }
      
      const retryBtn = document.getElementById('retry-editor-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          setShowFallbackView(false);
        });
      }
    }, 100);
  };
  
  return (
    <div className="stackblitz-container h-full relative">
      {isLoading && !showFallbackView && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-70 flex items-center justify-center z-10">
          <div className="text-center p-4 bg-white rounded shadow-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-lg font-semibold">Cargando editor...</p>
            <p className="text-sm text-gray-600 mt-2">Esto puede tardar unos segundos</p>
          </div>
        </div>
      )}
      
      <div ref={containerRef} className="h-full w-full"></div>
    </div>
  );
}
