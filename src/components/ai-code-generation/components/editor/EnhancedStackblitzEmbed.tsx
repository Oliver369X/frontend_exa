'use client';

import { useEffect, useRef, useState } from 'react';
import sdk from '@stackblitz/sdk';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Terminal } from '../terminal/Terminal';
import type { VM, Project, ProjectFiles, EmbedOptions } from '@stackblitz/sdk';

interface EnhancedStackblitzEmbedProps {
  projectId: string;
  generatedCode?: string;
}

export function EnhancedStackblitzEmbed({ projectId, generatedCode }: EnhancedStackblitzEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const vmRef = useRef<VM | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<ProjectFiles>({});
  const [processingFiles, setProcessingFiles] = useState(false);
  
  // Configuración inicial del proyecto de StackBlitz
  useEffect(() => {
    const setupProject = async () => {
      if (!containerRef.current) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Proyecto Angular básico
        const project: Project = {
          title: `Angular Project - ${projectId}`,
          description: 'Generated Angular Project',
          template: 'angular-cli',
          files: {
            'src/main.ts': `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
`,
            'src/app/app.component.ts': `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: \`
    <h1>Welcome to {{ title }}!</h1>
    <router-outlet></router-outlet>
  \`
})
export class AppComponent {
  title = 'Angular App';
}
`,
            'src/app/app.config.ts': `import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes)]
};
`,
            'src/app/app.routes.ts': `import { Routes } from '@angular/router';

export const routes: Routes = [];
`
          },
          settings: {
            compile: {
              clearConsole: true,
            }
          }
        };
        
        // Opciones de incrustación
        const options: EmbedOptions = {
          openFile: 'src/app/app.component.ts',
          terminalHeight: 30,
          view: 'editor',
          hideNavigation: false,
          height: '100%'
        };
        
        console.log('[StackBlitz] Inicializando proyecto:', project.title);
        
        // Crear y embeber el proyecto
        try {
          const vm = await sdk.embedProject(containerRef.current, project, options);
          vmRef.current = vm;
          console.log('[StackBlitz] Proyecto creado y embebido exitosamente');
          
          // Configurar manejador de comandos del terminal
          vm.terminal.addEventListener('command', async (event) => {
            console.log('[StackBlitz Terminal] Comando ejecutado:', event.command);
          });
          
          // Procesar código generado si existe
          if (generatedCode) {
            const extractedFiles = extractFilesFromMarkdown(generatedCode);
            if (Object.keys(extractedFiles).length > 0) {
              setPendingFiles(extractedFiles);
            }
          }
        } catch (embedError) {
          console.error('[StackBlitz] Error al configurar StackBlitz:', embedError);
          setError(`Error al configurar StackBlitz: ${embedError}`);
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('[StackBlitz] Error global:', error);
        setError(`Error global: ${error}`);
        setIsLoading(false);
      }
    };
    
    setupProject();
  }, [projectId]);
  
  // Manejar cambios en el código generado
  useEffect(() => {
    if (!generatedCode || !vmRef.current || processingFiles) return;
    
    const processGeneratedCode = async () => {
      try {
        setProcessingFiles(true);
        const extractedFiles = extractFilesFromMarkdown(generatedCode);
        
        if (Object.keys(extractedFiles).length > 0) {
          console.log('[StackBlitz] Archivos extraídos del código:', Object.keys(extractedFiles));
          setPendingFiles(prev => ({...prev, ...extractedFiles}));
        } else {
          console.log('[StackBlitz] No se encontraron archivos en el código generado');
        }
      } catch (error) {
        console.error('[StackBlitz] Error al procesar código generado:', error);
      } finally {
        setProcessingFiles(false);
      }
    };
    
    processGeneratedCode();
  }, [generatedCode]);
  
  // Aplicar cambios pendientes a los archivos
  useEffect(() => {
    if (!vmRef.current || Object.keys(pendingFiles).length === 0 || processingFiles) return;
    
    const applyFileChanges = async () => {
      try {
        setProcessingFiles(true);
        const vm = vmRef.current;
        if (!vm) return;
        
        console.log('[StackBlitz] Aplicando cambios a archivos:', Object.keys(pendingFiles));
        
        // Antes de escribir, obtener lista de archivos existentes
        const existingFiles = await vm.getFsSnapshot();
        
        for (const [path, content] of Object.entries(pendingFiles)) {
          // Verificar si el archivo ya existe
          const fileExists = existingFiles.files[path];
          
          if (fileExists) {
            // Modificar archivo existente
            await vm.fs.writeFile(path, content);
          } else {
            // Crear nuevo directorio y archivo
            const dirPath = path.split('/').slice(0, -1).join('/');
            await vm.fs.mkdir(dirPath, { recursive: true });
            await vm.fs.writeFile(path, content, { create: true });
          }
        }
        
        // Limpiar archivos pendientes procesados
        setPendingFiles({});
      } catch (error) {
        console.error('[StackBlitz] Error al aplicar cambios de archivos:', error);
      } finally {
        setProcessingFiles(false);
      }
    };
    
    applyFileChanges();
  }, [pendingFiles, processingFiles]);
  
  // Función mejorada para extraer archivos del markdown
  function extractFilesFromMarkdown(markdown: string): ProjectFiles {
    const files: ProjectFiles = {};
    
    // Regex mejorado para capturar bloques de código con nombre de archivo
    // Soporta varios formatos comunes en markdown
    const codeBlockRegex = /```(?:(?:typescript|javascript|ts|js|html|css|scss|json|xml|([a-zA-Z]+))\s*(?:\n|^))?(?:([^\n]+)\n)?([\s\S]*?)```/g;
    
    let match;
    while ((match = codeBlockRegex.exec(markdown)) !== null) {
      let language = match[1] || '';
      let filePath = match[2] || '';
      const code = match[3].trim();
      
      // Si no hay una ruta de archivo explícita, intentar inferirla
      if (!filePath || filePath.startsWith('// ') || filePath.startsWith('/* ')) {
        // Buscar en el contenido por comentarios que puedan indicar el archivo
        const filePathComment = code.match(/\/\/\s*(?:file|path):\s*([^\n]+)/i) || 
                               code.match(/\/\*\s*(?:file|path):\s*([^\n]+)\s*\*\//i);
        
        if (filePathComment) {
          filePath = filePathComment[1].trim();
        } else if (language) {
          // Inferir basado en el lenguaje
          const extension = getExtensionFromLanguage(language);
          if (extension) {
            // Generar un nombre basado en el contenido
            const contentHash = Math.abs(hashCode(code)).toString(16).substring(0, 6);
            filePath = `src/generated/${language}-${contentHash}.${extension}`;
          }
        }
      }
      
      // Limpiar la ruta de archivo (quitar prefijos de comentarios)
      if (filePath.startsWith('// ')) {
        filePath = filePath.substring(3).trim();
      } else if (filePath.startsWith('/* ')) {
        filePath = filePath.replace(/\/\*|\*\//g, '').trim();
      }
      
      // Si tenemos una ruta de archivo válida, agregar al objeto de archivos
      if (filePath && code) {
        // Asegurarse de que la ruta tenga un formato adecuado
        if (!filePath.startsWith('src/')) {
          filePath = `src/${filePath}`;
        }
        
        files[filePath] = code;
      }
    }
    
    return files;
  }
  
  // Función auxiliar para obtener extensión de archivo según el lenguaje
  function getExtensionFromLanguage(language: string): string {
    const languageMap: Record<string, string> = {
      'typescript': 'ts',
      'javascript': 'js',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'bash': 'sh',
      'shell': 'sh',
      'xml': 'xml',
      'ts': 'ts',
      'js': 'js'
    };
    
    return languageMap[language.toLowerCase()] || language.toLowerCase();
  }
  
  // Función para generar un hash simple de un string
  function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a entero de 32 bits
    }
    return hash;
  }
  
  // Función para ejecutar comandos en el terminal
  const executeCommand = async (command: string): Promise<boolean> => {
    if (!vmRef.current) return false;
    
    try {
      await vmRef.current.terminal.sendCommand(command);
      return true;
    } catch (error) {
      console.error('[StackBlitz] Error al ejecutar comando:', error);
      return false;
    }
  };
  
  return (
    <div className="stackblitz-container h-full relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-70 flex items-center justify-center z-10">
          <div className="text-center p-4 bg-white rounded shadow-lg">
            <p className="text-lg font-semibold">Cargando editor...</p>
            <p className="text-sm text-gray-600 mt-2">Configurando el entorno de Angular</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 bg-red-100 bg-opacity-80 flex items-center justify-center z-10">
          <div className="text-center p-4 bg-white rounded shadow-lg max-w-md">
            <p className="text-lg font-semibold text-red-600">Error al configurar StackBlitz</p>
            <p className="text-sm mt-2">{error}</p>
            <button 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
      
      <div ref={containerRef} className="h-full w-full"></div>
    </div>
  );
}
