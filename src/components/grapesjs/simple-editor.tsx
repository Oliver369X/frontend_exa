"use client";

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import grapesjs, { Editor, ProjectData } from "grapesjs";
import type { Editor as GrapesJSEditor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import gjsBasicBlocks from "grapesjs-blocks-basic";
import allPlugins from './plugins';
import cn from 'classnames';

// Importar componentes y utilidades desde archivos separados
import { ToolbarButton } from './components/ToolbarButton';
import { TabButton } from './components/TabButton';
import { DEFAULT_BLOCKS } from './config/blocks';
import { GrapesJSActions, setupEditorActions } from './utils/editorActions';
import type { GrapesJSData, EditorDeltaUpdate, SimpleGrapesEditorHandle } from './types';

// Importar socket para la sincronización
import { Socket } from 'socket.io-client';
import { useSocketContext } from '@/components/socket';

// Exportar los tipos principales para uso externo
export type { GrapesJSData, EditorDeltaUpdate, SimpleGrapesEditorHandle };

interface SimpleGrapesJSEditorProps {
  initialContent: GrapesJSData | string | null;
  onChange?: (update: EditorDeltaUpdate) => void; 
  readOnly?: boolean;
  projectId?: string; // ID del proyecto para guardar en la base de datos
}

// Declarar global con nuestras funciones
declare global {
  interface Window {
    grapesJsActions?: GrapesJSActions;
    currentProjectId?: string; // ID del proyecto actual para pageManager
    socketInstance?: Socket; // Instancia del socket para comunicación en tiempo real
  }
}

const SimpleGrapesJSEditor = forwardRef<SimpleGrapesEditorHandle, SimpleGrapesJSEditorProps>(
  ({ initialContent, onChange, readOnly = false, projectId }, ref) => {
    const editorRefInternal = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
    const panelsInitialized = useRef(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const { socket } = useSocketContext(); // Obtener la instancia del socket

    useImperativeHandle(ref, () => ({
      getEditorInstance: () => editorRefInternal.current,
    }), []);

    // Función para manipular paneles
    const createShowPanelFn = (panelId: string) => {
      return () => {
        const panels = ['style', 'layers', 'traits'];
        panels.forEach(p => {
          const tabElement = document.getElementById(`tab-${p}`);
          const panelElement = document.getElementById(`panel__${p}-manager`);
          
          if (tabElement) {
            if (p === panelId) {
              tabElement.classList.add('active');
            } else {
              tabElement.classList.remove('active');
            }
          }
          
          if (panelElement) {
            panelElement.style.display = p === panelId ? 'block' : 'none';
          }
        });
      };
    };

  useEffect(() => {
      if (!containerRef.current || editorRefInternal.current) return;

      // Configurar el ID del proyecto en window para el pageManager
      if (typeof window !== 'undefined' && projectId) {
        // @ts-expect-error - Añadir propiedad currentProjectId a window
        window.currentProjectId = projectId;
        
        // Configurar el socket en window para el pageManager
        if (socket) {
          // @ts-expect-error - Añadir propiedad socketInstance a window
          window.socketInstance = socket;
          console.log('[Editor] Socket configurado para el pageManager:', socket.id);
        }
      }

      // Configuración del editor
      const editor = grapesjs.init({
      container: containerRef.current,
      height: "100%",
      width: "auto",
        // Habilitar almacenamiento local para respaldo
        storageManager: {
          type: 'local',
          autosave: true,
          autoload: true,
          stepsBeforeSave: 1,
          options: {
            local: { key: `grapesjs-project-${Date.now()}` }
          }
        },
        pageManager: {
          pages: [
            {
              id: 'page-1',
              name: 'Página Principal',
              component: '<h1>Página Principal</h1><p>Empieza a editar tu contenido aquí.</p>'
            }
          ]
        },
        panels: { defaults: [] },
        layerManager: { appendTo: '#panel__layer-manager' },
        styleManager: {
          appendTo: '#panel__style-manager',
          sectors: [
            { name: 'Dimensiones', open: false, properties: ['width', 'height', 'min-width', 'min-height', 'max-width', 'max-height', 'padding', 'margin'] },
            { name: 'Tipografía', open: false, properties: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-shadow'] },
            { name: 'Decoración', open: false, properties: ['background-color', 'border', 'border-radius', 'box-shadow'] },
            { name: 'Extra', open: false, properties: ['opacity', 'transition', 'transform', 'perspective', 'filter'] }
          ],
        },
        traitManager: { appendTo: '#panel__trait-manager' },
        blockManager: { 
          appendTo: '#blocks-container', 
          blocks: DEFAULT_BLOCKS,
      },
      deviceManager: {
        devices: [
            { name: "Desktop", width: "" },
            { name: "Tablet", width: "768px", widthMedia: "768px" },
            { name: "Mobile", width: "320px", widthMedia: "480px" },
          ],
        },
        // Cargar solo gjsBasicBlocks en la inicialización
        plugins: [gjsBasicBlocks],
      canvas: {
          styles: ["https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"],
          scripts: ["https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"],
          // Reducir los márgenes del canvas
          frameStyle: `
            body { 
              margin: 0;
              padding: 0 !important;
              background-color: #fff;
            }
            * ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
          `,
        },
      });

      editorRefInternal.current = editor;

      // Cargar contenido inicial primero
    if (initialContent) {
        if (typeof initialContent === 'object' && initialContent !== null) {
          if (Array.isArray(initialContent.components) && initialContent.components.length > 0) {
            editor.addComponents(initialContent.components);
          } else if (!readOnly) {
            editor.setComponents('<h1>Start Editing</h1>');
          }
          if (typeof initialContent.styles === 'string') {
            editor.setStyle(initialContent.styles);
          }
        } else if (typeof initialContent === 'string') {
      editor.setComponents(initialContent);
        } else if (!readOnly) {
          editor.setComponents('<h1>Start Editing</h1>');
        }
      } else if (!readOnly) {
        editor.setComponents('<h1>Start Editing</h1>');
    }

      // Modo de solo lectura
    if (readOnly) {
        editor.Commands.stop('core:component-select');
        editor.Commands.stop('core:component-move');
        editor.Commands.stop('core:component-delete');
        editor.Commands.run('core:preview');
      editor.UndoManager.clear();
      }

      // Configurar acciones del editor
      window.grapesJsActions = setupEditorActions(editor, createShowPanelFn);

      // Inicializar plugins adicionales una vez que el editor esté listo
      // Esto asegura que el editor esté completamente inicializado antes de cargar nuestros plugins
      console.log('[Editor] Inicializando plugins personalizados...');
      
      // Timeout para asegurar que el editor está completamente inicializado
      setTimeout(() => {
        // Importar los plugins uno por uno
        try {
          // Cargar plugins de bloques de negocio y empresa
          const { businessBlocks, enterpriseBlocks } = require('./plugins');
          businessBlocks(editor);
          enterpriseBlocks(editor);
          
          // Cargar el plugin de integración Angular
          const { angularIntegrationPlugin } = require('./plugins');
          angularIntegrationPlugin(editor);
          
          // Cargar el plugin de gestión de páginas al final, cuando todo esté listo
          console.log('[Editor] Cargando PageManager plugin...');
          const { pageManagerPlugin } = require('./plugins');
          pageManagerPlugin(editor);
          
          console.log('[Editor] Todos los plugins cargados correctamente');
        } catch (error) {
          console.error('[Editor] Error al cargar plugins personalizados:', error);
        }
      }, 500);

      // Manejar cambios en el editor
      if (onChange && !readOnly) {
        editor.on("component:add", (component) => {
          onChange({ 
            type: 'component:add', 
            data: component.toJSON() as Record<string, unknown>, 
            parentId: component.parent()?.getId(), 
            index: component.index() 
          });
        });
        
        editor.on("component:update", (component, changed) => {
          if (!changed || Object.keys(changed).some(key => ['status', 'open'].includes(key))) return;
          onChange({ 
            type: 'component:update', 
            data: { changed, component: component.toJSON() } as Record<string, unknown>, 
            componentId: component.getId() 
          });
        });
        
        editor.on("component:remove", (component) => {
          onChange({ 
            type: 'component:remove', 
            data: { componentId: component.getId() } as Record<string, unknown>, 
            parentId: component.parent()?.getId() 
          });
        });
        
        editor.on("component:move", (component, data) => {
          onChange({ 
            type: 'component:move', 
            data: { ...data, componentId: component.getId() } as Record<string, unknown> 
          });
        });
        
        editor.on("style:update", (style) => {
          onChange({ type: 'style:update', data: style as Record<string, unknown> });
        });
        
        editor.on("style:add", (style) => {
          onChange({ type: 'style:add', data: style as Record<string, unknown> });
        });
        
        editor.on("style:remove", (style) => {
          onChange({ type: 'style:remove', data: style as Record<string, unknown> });
        });
        
        editor.on("page:add page:remove page:update page:select", () => {
          const pages = editor.Pages.getAll();
          const pagesData = pages.map(page => ({
            id: page.get('id') || `page-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: page.get('name'),
            styles: page.get('styles'),
            component: page.getMainComponent()?.toJSON()
          }));
          
          onChange({
            type: 'pages:update',
            data: { pages: pagesData } as Record<string, unknown>
          });
        });
      }

      // Limpieza al desmontar
      return () => {
        if (window.grapesJsActions) {
          window.grapesJsActions = undefined;
        }
        editorRefInternal.current?.destroy();
        editorRefInternal.current = null;

        // Limpiar el ID del proyecto y el socket al desmontar
        if (typeof window !== 'undefined') {
          // @ts-expect-error - Eliminar propiedades de window
          delete window.currentProjectId;
          // @ts-expect-error - Eliminar propiedades de window
          delete window.socketInstance;
        }
      };
    }, [JSON.stringify(initialContent), onChange, readOnly, projectId, socket]);

    // Inicializar los paneles después de que el componente esté montado
    useEffect(() => {
      // Establecer el panel de estilos como activo después del renderizado
      if (!panelsInitialized.current && window.grapesJsActions) {
        // Esperar a que el DOM esté listo
        setTimeout(() => {
          if (window.grapesJsActions?.showStyles) {
            window.grapesJsActions.showStyles();
            panelsInitialized.current = true;
          }
        }, 100);
      }
    }, []);

    // Función para guardar el proyecto en la base de datos
    const saveProjectToDatabase = async () => {
      if (!editorRefInternal.current || !projectId) return;
      
      try {
        setIsSaving(true);
        
        const editor = editorRefInternal.current;
        const html = editor.getHtml();
        const css = editor.getCss();
        const js = editor.getJs ? editor.getJs() : '';
        
        // Obtener datos de todas las páginas si existen
        const pages: Array<{
          id: string;
          name: string;
          component: Record<string, unknown>;
        }> = [];
        
        if (editor.Pages) {
          editor.Pages.getAll().forEach(page => {
            const component = page.getMainComponent()?.toJSON();
            if (component) {
              pages.push({
                id: page.get('id') as string,
                name: page.get('name') as string,
                component: component as Record<string, unknown>
              });
            }
          });
        }
        
        // Crear objeto con todos los datos del proyecto
        const projectData = {
          id: projectId,
          html,
          css,
          js,
          pages,
          components: editor.getComponents().toJSON(),
          lastModified: new Date().toISOString()
        };
        
        // Enviar al backend - reemplazar URL con la correcta
        const response = await fetch('/api/projects/save', {
          method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
          body: JSON.stringify(projectData),
      });

      if (!response.ok) {
          throw new Error('Error al guardar el proyecto');
      }

        setLastSaved(new Date());
        console.log(`Proyecto guardado: ${new Date().toLocaleTimeString()}`);
        // Mostrar mensaje de éxito usando un toast o sistema de notificaciones
        // ...
    } catch (error) {
        console.error('Error al guardar el proyecto:', error);
        // Mostrar mensaje de error usando un toast o sistema de notificaciones
        // ...
      } finally {
        setIsSaving(false);
      }
    };

    // Renderizar la interfaz de usuario
  return (
      <div className="grapesjs-editor h-full">
        {/* Panel izquierdo - Bloques */}
        {!readOnly && (
          <div className="editor-sidebar w-60 flex-shrink-0 border-r border-border bg-muted dark:bg-neutral-900/50 flex flex-col">
            <div className="sidebar-header p-3 font-semibold border-b border-border">Bloques</div>
            <div id="blocks-container" className="blocks-container flex-grow overflow-y-auto p-3 space-y-2"></div>
          </div>
        )}
        
        {/* Área central - Editor */}
        <div className="editor-main flex-grow flex flex-col min-w-0 bg-background">
          {/* Barra superior */}
          {!readOnly && (
            <div className="custom-topbar flex items-center justify-between p-1 border-b border-border bg-muted dark:bg-neutral-900/50 flex-shrink-0">
              {/* Botones de edición */}
              <div className="flex items-center space-x-1">
                <ToolbarButton
                  title="Deshacer"
                  onClick={() => editorRefInternal.current?.UndoManager.undo()}
                  icon={<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12.5,8C9.85,8 7.45,9 5.6,10.6L2,7V16H11L7.38,12.38C8.77,11.22 10.54,10.5 12.5,10.5C16.04,10.5 19.05,12.81 20.1,16L22.47,15.22C21.08,11.03 17.15,8 12.5,8Z"></path></svg>}
                />
                <ToolbarButton
                  title="Rehacer"
                  onClick={() => editorRefInternal.current?.UndoManager.redo()}
                  icon={<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M18.4,10.6C16.55,9 14.15,8 11.5,8C6.85,8 2.92,11.03 1.54,15.22L3.9,16C4.95,12.81 7.95,10.5 11.5,10.5C13.45,10.5 15.23,11.22 16.62,12.38L13,16H22V7L18.4,10.6Z"></path></svg>}
                />
                <div className="border-r border-border h-5 mx-1"></div>
                <ToolbarButton
                  title="Mostrar Bordes"
                  onClick={() => window.grapesJsActions?.toggleComponentOutline()}
                  icon={<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M3,3 L21,3 L21,21 L3,21 L3,3 Z M5,5 L5,19 L19,19 L19,5 L5,5 Z"></path></svg>}
                />
                <ToolbarButton
                  title="Vista Previa"
                  onClick={() => window.grapesJsActions?.togglePreview()}
                  icon={<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12,9 A3,3 0 0,1 15,12 A3,3 0 0,1 12,15 A3,3 0 0,1 9,12 A3,3 0 0,1 12,9 M12,4.5 C17,4.5 21.27,7.61 23,12 C21.27,16.39 17,19.5 12,19.5 C7,19.5 2.73,16.39 1,12 C2.73,7.61 7,4.5 12,4.5 Z"></path></svg>}
                />
                <ToolbarButton
                  title="Administrar Páginas"
                  onClick={() => window.grapesJsActions?.openPagesDialog()}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>}
                />
                <ToolbarButton
                  title="Exportar HTML"
                  onClick={() => window.grapesJsActions?.exportHTML()}
                  icon={<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"></path></svg>}
                />
                {projectId && (
                  <>
                    <ToolbarButton
                      title="Guardar Proyecto"
                      onClick={saveProjectToDatabase}
                      className={isSaving ? 'opacity-50 cursor-wait' : ''}
                      disabled={isSaving}
                      icon={<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z"></path></svg>}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar'}
                    </ToolbarButton>
                    {lastSaved && (
                      <span className="text-xs text-gray-500 ml-2" title={lastSaved.toLocaleString()}>
                        Guardado: {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </>
                )}
                {process.env.NODE_ENV === 'development' && (
                  <ToolbarButton
                    id="debug-pages"
                    title="Depurar páginas"
                    className="fa fa-bug"
                    onClick={() => {
                      // Obtener la instancia del editor
                      const editorInstance = editorRefInternal.current;
                      if (!editorInstance) return;
                      
                      if (typeof window !== 'undefined') {
                        const projectId = window.currentProjectId || null;
                        if (projectId) {
                          const storageKey = `project_${projectId}_pages`;
                          const pagesData = localStorage.getItem(storageKey);
                          
                          console.group('Depuración de páginas');
                          console.log('Project ID:', projectId);
                          console.log('Storage Key:', storageKey);
                          
                          if (pagesData) {
                            try {
                              const pages = JSON.parse(pagesData);
                              console.log('Páginas guardadas:', pages);
                              console.log('Número de páginas:', pages.length);
                              
                              // Mostrar páginas actuales en el editor
                              const editorPages = editorInstance.Pages.getAll();
                              console.log('Páginas actuales en editor:', editorPages.map((p: any) => ({
                                id: p.get('id'),
                                name: p.get('name')
                              })));
                            } catch (error) {
                              console.error('Error al parsear páginas:', error);
                            }
                          } else {
                            console.log('No hay páginas guardadas para este proyecto');
                          }
                          
                          console.groupEnd();
                          
                          // Mostrar alerta para facilidad de verificación
                          alert(`Depuración de páginas completada. Revisa la consola para ver los detalles.
Project ID: ${projectId}
Páginas en localStorage: ${pagesData ? JSON.parse(pagesData).length : 0}
Páginas en editor: ${editorInstance.Pages.getAll().length}`);
                        }
                      }
                    }}
                  />
                )}
              </div>
              
              {/* Botones de dispositivo */}
              <div className="flex items-center space-x-1">
                <ToolbarButton
                  id="device-desktop"
                  title="Escritorio"
                  initialActive={true}
                  onClick={() => window.grapesJsActions?.setDeviceDesktop()}
                  icon={<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M21,16H3V4H21M21,2H3C1.89,2 1,2.89 1,4V16C1,17.11 1.9,18 3,18H10V20H8V22H16V20H14V18H21C22.11,18 23,17.11 23,16V4C23,2.89 22.1,2 21,2Z"></path></svg>}
                />
                <ToolbarButton
                  id="device-tablet"
                  title="Tablet"
                  onClick={() => window.grapesJsActions?.setDeviceTablet()}
                  icon={<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19,18H5V6H19M21,4H3C1.89,4 1,4.89 1,6V18C1,19.1 1.9,20 3,20H21C22.1,20 23,19.1 23,18V6C23,4.89 22.1,4 21,4Z"></path></svg>}
                />
                <ToolbarButton
                  id="device-mobile"
                  title="Móvil"
                  onClick={() => window.grapesJsActions?.setDeviceMobile()}
                  icon={<svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M17,19H7V5H17M17,1H7C5.89,1 5,1.89 5,3V21C5,22.11 5.9,23 7,23H17C18.11,23 19,22.11 19,21V3C19,1.89 18.1,1 17,1Z"></path></svg>}
                />
              </div>
            </div>
          )}
          
          {/* Lienzo del editor con altura 100% */}
          <div ref={containerRef} className="editor-canvas w-full flex-grow"></div>
        </div>

        {/* Panel derecho - Propiedades */}
        {!readOnly && (
          <div className="editor-right-sidebar w-60 flex-shrink-0 border-l border-border bg-muted dark:bg-neutral-900/50 flex flex-col">
            {/* Tabs */}
            <div className="panel__tabs flex items-center justify-around p-1 border-b border-border">
              <TabButton id="tab-style" label="Estilos" active={true} onClick={() => window.grapesJsActions?.showStyles()} />
              <TabButton id="tab-layers" label="Capas" onClick={() => window.grapesJsActions?.showLayers()} />
              <TabButton id="tab-traits" label="Atributos" onClick={() => window.grapesJsActions?.showTraits()} />
            </div>
            
            {/* Contenedores de paneles */}
            <div id="panel__style-manager" className="panel__style-manager flex-grow overflow-y-auto"></div>
            <div id="panel__layer-manager" className="panel__layer-manager flex-grow overflow-y-auto" style={{ display: 'none' }}></div>
            <div id="panel__trait-manager" className="panel__trait-manager flex-grow overflow-y-auto" style={{ display: 'none' }}></div>
          </div>
        )}

        {/* Estilos optimizados para aprovechar todo el espacio disponible */}
      <style jsx>{`
        .grapesjs-editor {
          display: flex;
            height: 100vh; /* Usa toda la altura de la ventana */
          overflow: hidden;
            background-color: hsl(var(--background));
          }
          
          .editor-canvas {
            height: 100%;
            min-height: 0; /* Importante para flexbox */
          }
          
          .tab-button.active {
            background-color: hsl(var(--primary) / 0.2);
            color: hsl(var(--primary));
            font-weight: bold;
          }
          
          .toolbar-btn.active {
            background-color: hsl(var(--primary) / 0.2);
            color: hsl(var(--primary));
          }
          
          .toolbar-btn:hover:not(:disabled) {
            background-color: hsl(var(--primary) / 0.1);
          }
          
          .toolbar-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          
          /* Mejora para bloques */
        :global(.gjs-block) {
            transition: all 0.2s ease;
            width: 90% !important;
            min-height: auto !important;
            padding: 0.5rem !important;
            margin: 5px auto !important;
        }
        
        :global(.gjs-block:hover) {
            box-shadow: 0 3px 10px rgba(0,0,0,0.15);
            transform: translateY(-2px);
          }
          
          /* Mejor visualización del canvas */
          :global(.gjs-cv-canvas) {
            background-color: #f9f9f9;
            background-image: linear-gradient(45deg, #ececec 25%, transparent 25%), 
                              linear-gradient(-45deg, #ececec 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #ececec 75%), 
                              linear-gradient(-45deg, transparent 75%, #ececec 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            height: 100%;
          }
          
          /* Ajuste para el área de edición */
          :global(.gjs-editor) {
            height: 100%;
          display: flex;
            flex-direction: column;
          }
          
          :global(.gjs-cv-canvas) {
            flex-grow: 1;
            height: auto !important;
            overflow: auto;
          }
          
          /* Reducir el padding del frame de edición */
          :global(.gjs-frame) {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Ajustes para categorías y bloques */
          :global(.gjs-block-category) {
            padding: 10px 5px !important;
          }
          
          :global(.gjs-block-category.gjs-open) {
            padding-bottom: 10px !important;
          }
          
          :global(.gjs-blocks-c) {
            padding: 0 !important;
            justify-content: flex-start !important;
          }
          
          :global(.gjs-category-title) {
            font-size: 0.9rem !important;
            font-weight: bold !important;
            padding: 8px 10px !important;
        }
      `}</style>
    </div>
  );
}
);

SimpleGrapesJSEditor.displayName = "SimpleGrapesJSEditor";

export default SimpleGrapesJSEditor;
