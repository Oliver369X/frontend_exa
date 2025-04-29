"use client";

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react";
import grapesjs, { Editor, ProjectData } from "grapesjs";
import type { Editor as GrapesJSEditor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import gjsBasicBlocks from "grapesjs-blocks-basic";
import allPlugins from './plugins';
import { businessBlocks, enterpriseBlocks, pageManagerPlugin, angularIntegrationPlugin } from './plugins';
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

// Importar los servicios y plugins
import { GrapesJSBridgeService } from './service/grapesjs-bridge.service';
import PagesSyncService from './service/pages-sync.service';
import ImportPlugin from './plugins/import-plugin';
// Comentado hasta que se implemente completamente
// import ImageImporterPlugin from './plugins/image-importer';

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
        window.currentProjectId = projectId;
        
        // Configurar el socket en window para el pageManager
        if (socket) {
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
          type: 'session',
          autosave: true,
          autoload: true,
          stepsBeforeSave: 3,
          options: {
            local: { key: `grapesjs-project-${Date.now()}` },
            session: { key: `grapesjs-project-${Date.now()}` }
          },
          onStore: (data) => {
            if (data.pages) {
              data.pages = data.pages.map((page) => ({
                id: page.id,
                name: page.name,
                component: page.component 
                  ? {
                      type: page.component.type,
                      content: page.component.content,
                      attributes: page.component.attributes || {}
                    } 
                  : null
              }));
            }
            return data;
          }
        },
        pageManager: {
          pages: [
            {
              id: 'page-1',
              name: 'Página Principal',
              //component: '<h1>Página Principal</h1><p>Empieza a editar tu contenido aquí.</p>'
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
          plugins: [
            gjsBasicBlocks,
            businessBlocks,
            enterpriseBlocks,
            angularIntegrationPlugin,
            pageManagerPlugin,
            ImportPlugin,
            // ImageImporterPlugin, // Comentado hasta implementación completa
          ],
          canvas: {
            styles: ["https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css"],
            scripts: ["https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"],
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
            `
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

        // Mejorar la configuración del editor con comandos propios
        editor.Commands.add('open-pages', {
          run: (editor) => {
            // Crear modal para administrar páginas
            if (!editor.Pages) {
              console.error('No se encontró el administrador de páginas');
              return;
            }
            
            const pages = editor.Pages.getAll();
            const modalContainer = document.createElement('div');
            modalContainer.className = 'gjs-mdl-dialog gjs-one-bg gjs-two-color';
            modalContainer.innerHTML = `
              <div class="gjs-mdl-header">
                <div class="gjs-mdl-title">Administrar Páginas</div>
                <div class="gjs-mdl-btn-close" id="gjs-mdl-btn-close">×</div>
              </div>
              <div class="gjs-mdl-content">
                <div id="pages-container" class="pages-container">
                  <div class="pages-header">
                    <div class="page-header-cell">Nombre</div>
                    <div class="page-header-cell">Acciones</div>
                  </div>
                  <div id="pages-list" class="pages-list">
                    ${pages.map(page => `
                      <div class="page-row" data-page-id="${page.get('id')}">
                        <div class="page-cell page-name">
                          <span>${page.get('name')}</span>
                        </div>
                        <div class="page-cell page-actions">
                          <button class="page-select ${editor.Pages.getSelected().get('id') === page.get('id') ? 'active' : ''}">Ver</button>
                          <button class="page-edit">Editar</button>
                          <button class="page-delete" ${pages.length <= 1 ? 'disabled' : ''}>Eliminar</button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                  <div class="pages-footer">
                    <button id="add-new-page">Añadir página</button>
                  </div>
                </div>
              </div>
            `;
            
            // Agregar estilos
            const style = document.createElement('style');
            style.innerHTML = `
              .pages-container {
                padding: 10px;
              }
              .pages-header {
                display: grid;
                grid-template-columns: 1fr 150px;
                border-bottom: 1px solid rgba(0,0,0,0.1);
                padding-bottom: 5px;
                margin-bottom: 10px;
                font-weight: bold;
              }
              .pages-list {
                max-height: 300px;
                overflow-y: auto;
              }
              .page-row {
                display: grid;
                grid-template-columns: 1fr 150px;
                border-bottom: 1px solid rgba(0,0,0,0.05);
                padding: 8px 0;
              }
              .page-cell {
                display: flex;
                align-items: center;
              }
              .page-actions {
                display: flex;
                gap: 5px;
              }
              .page-actions button {
                padding: 3px 8px;
                background: var(--gjs-color-light);
                border: none;
                border-radius: 3px;
                cursor: pointer;
              }
              .page-actions button:hover {
                background: var(--gjs-color-lighter);
              }
              .page-actions button.active {
                background: var(--gjs-color-action);
                color: white;
              }
              .page-actions button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
              .pages-footer {
                margin-top: 15px;
                display: flex;
                justify-content: flex-end;
              }
              #add-new-page {
                padding: 7px 15px;
                background: var(--gjs-color-action);
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
              }
            `;
            
            document.body.appendChild(style);
            document.body.appendChild(modalContainer);
            
            // Eventos
            const closeBtn = modalContainer.querySelector('#gjs-mdl-btn-close');
            closeBtn?.addEventListener('click', () => {
              document.body.removeChild(modalContainer);
              document.body.removeChild(style);
            });
            
            // Seleccionar página
            const selectButtons = modalContainer.querySelectorAll('.page-select');
            selectButtons.forEach(btn => {
              btn.addEventListener('click', (e) => {
                const pageRow = (e.target as HTMLElement).closest('.page-row');
                const pageId = pageRow?.getAttribute('data-page-id');
                if (pageId) {
                  editor.Pages.select(pageId);
                  
                  // Actualizar botones
                  document.querySelectorAll('.page-select').forEach(el => {
                    el.classList.remove('active');
                  });
                  (e.target as HTMLElement).classList.add('active');
                }
              });
            });
            
            // Editar nombre de página
            const editButtons = modalContainer.querySelectorAll('.page-edit');
            editButtons.forEach(btn => {
              btn.addEventListener('click', (e) => {
                const pageRow = (e.target as HTMLElement).closest('.page-row');
                const pageId = pageRow?.getAttribute('data-page-id');
                const nameCell = pageRow?.querySelector('.page-name');
                const nameSpan = nameCell?.querySelector('span');
                
                if (pageId && nameCell && nameSpan) {
                  const currentName = nameSpan.textContent || '';
                  const input = document.createElement('input');
                  input.type = 'text';
                  input.value = currentName;
                  input.style.width = '100%';
                  input.style.padding = '3px 5px';
                  input.style.boxSizing = 'border-box';
                  
                  // Reemplazar span por input
                  nameCell.replaceChild(input, nameSpan);
                  input.focus();
                  
                  // Guardar al perder foco
                  input.addEventListener('blur', () => {
                    const newName = input.value.trim() || currentName;
                    nameSpan.textContent = newName;
                    nameCell.replaceChild(nameSpan, input);
                    
                    // Actualizar en el editor
                    const page = editor.Pages.get(pageId);
                    if (page) {
                      page.set('name', newName);
                    }
                  });
                  
                  // Guardar con Enter
                  input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                      input.blur();
                    }
                  });
                }
              });
            });
            
            // Eliminar página
            const deleteButtons = modalContainer.querySelectorAll('.page-delete');
            deleteButtons.forEach(btn => {
              btn.addEventListener('click', (e) => {
                const pageRow = (e.target as HTMLElement).closest('.page-row');
                const pageId = pageRow?.getAttribute('data-page-id');
                if (pageId) {
                  if (confirm('¿Estás seguro de que deseas eliminar esta página?')) {
                    // Verificar si es la página seleccionada
                    const isSelected = editor.Pages.getSelected().get('id') === pageId;
                    
                    // Si hay al menos otra página, eliminamos la actual
                    if (editor.Pages.getAll().length > 1) {
                      // Si es la seleccionada, seleccionar otra antes de eliminar
                      if (isSelected) {
                        const pages = editor.Pages.getAll();
                        const otherPage = pages.find(p => p.get('id') !== pageId);
                        if (otherPage) {
                          editor.Pages.select(otherPage.get('id'));
                        }
                      }
                      
                      // Eliminar la página
                      editor.Pages.remove(pageId);
                      
                      // Eliminar la fila
                      if (pageRow) {
                        pageRow.remove();
                      }
                    }
                  }
                }
              });
            });
            
            // Añadir nueva página
            const addPageBtn = modalContainer.querySelector('#add-new-page');
            addPageBtn?.addEventListener('click', () => {
              const pageId = `page-${Date.now()}`;
              const pageName = `Nueva Página ${editor.Pages.getAll().length + 1}`;
              
              // Crear nueva página
              editor.Pages.add({
                id: pageId,
                name: pageName
              });
              
              // Agregar a la lista
              const pagesList = modalContainer.querySelector('#pages-list');
              if (pagesList) {
                const pageRow = document.createElement('div');
                pageRow.className = 'page-row';
                pageRow.setAttribute('data-page-id', pageId);
                pageRow.innerHTML = `
                  <div class="page-cell page-name">
                    <span>${pageName}</span>
                  </div>
                  <div class="page-cell page-actions">
                    <button class="page-select">Ver</button>
                    <button class="page-edit">Editar</button>
                    <button class="page-delete">Eliminar</button>
                  </div>
                `;
                pagesList.appendChild(pageRow);
                
                // Actualizar eventos en los botones nuevos
                const selectBtn = pageRow.querySelector('.page-select');
                selectBtn?.addEventListener('click', () => {
                  editor.Pages.select(pageId);
                  document.querySelectorAll('.page-select').forEach(el => {
                    el.classList.remove('active');
                  });
                  selectBtn.classList.add('active');
                });
                
                const editBtn = pageRow.querySelector('.page-edit');
                editBtn?.addEventListener('click', (e) => {
                  const nameCell = pageRow.querySelector('.page-name');
                  const nameSpan = nameCell?.querySelector('span');
                  
                  if (nameCell && nameSpan) {
                    const currentName = nameSpan.textContent || '';
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = currentName;
                    input.style.width = '100%';
                    input.style.padding = '3px 5px';
                    input.style.boxSizing = 'border-box';
                    
                    nameCell.replaceChild(input, nameSpan);
                    input.focus();
                    
                    input.addEventListener('blur', () => {
                      const newName = input.value.trim() || currentName;
                      nameSpan.textContent = newName;
                      nameCell.replaceChild(nameSpan, input);
                      
                      const page = editor.Pages.get(pageId);
                      if (page) {
                        page.set('name', newName);
                      }
                    });
                    
                    input.addEventListener('keydown', (e) => {
                      if (e.key === 'Enter') {
                        input.blur();
                      }
                    });
                  }
                });
                
                const deleteBtn = pageRow.querySelector('.page-delete');
                deleteBtn?.addEventListener('click', () => {
                  if (confirm('¿Estás seguro de que deseas eliminar esta página?')) {
                    const isSelected = editor.Pages.getSelected().get('id') === pageId;
                    
                    if (editor.Pages.getAll().length > 1) {
                      if (isSelected) {
                        const pages = editor.Pages.getAll();
                        const otherPage = pages.find(p => p.get('id') !== pageId);
                        if (otherPage) {
                          editor.Pages.select(otherPage.get('id'));
                        }
                      }
                      
                      editor.Pages.remove(pageId);
                      pageRow.remove();
                    }
                  }
                });
                
                // Seleccionar la nueva página automáticamente
                editor.Pages.select(pageId);
                document.querySelectorAll('.page-select').forEach(el => {
                  el.classList.remove('active');
                });
                selectBtn?.classList.add('active');
              }
            });
          }
        });

        // Configurar acciones del editor
        window.grapesJsActions = setupEditorActions(editor, createShowPanelFn);

        // Añadir comando personalizado para administrar páginas
        window.grapesJsActions.openPagesDialog = () => {
          editor.Commands.run('open-pages');
        };

        // Inicializar plugins adicionales una vez que el editor esté listo
        // Esto asegura que el editor esté completamente inicializado antes de cargar nuestros plugins
        console.log('[Editor] Inicializando plugins personalizados...');
        
        // Timeout para asegurar que el editor está completamente inicializado
        setTimeout(() => {
          try {
            console.log('[Editor] Inicializando plugins personalizados...');
            
            // Usar los plugins importados directamente
            if (typeof businessBlocks === 'function') {
              try {
                businessBlocks(editor);
                console.log('[Editor] Plugin businessBlocks cargado');
              } catch (error) {
                console.error('[Editor] Error al cargar businessBlocks:', error);
              }
            }
            
            if (typeof enterpriseBlocks === 'function') {
              try {
                enterpriseBlocks(editor);
                console.log('[Editor] Plugin enterpriseBlocks cargado');
              } catch (error) {
                console.error('[Editor] Error al cargar enterpriseBlocks:', error);
              }
            }
            
            if (typeof angularIntegrationPlugin === 'function') {
              try {
                angularIntegrationPlugin(editor);
                console.log('[Editor] Plugin angularIntegrationPlugin cargado');
              } catch (error) {
                console.error('[Editor] Error al cargar angularIntegrationPlugin:', error);
              }
            }
            
            if (typeof pageManagerPlugin === 'function') {
              try {
                pageManagerPlugin(editor);
                console.log('[Editor] Plugin pageManagerPlugin cargado');
              } catch (error) {
                console.error('[Editor] Error al cargar pageManagerPlugin:', error);
              }
            }
            
            console.log('[Editor] Todos los plugins cargados correctamente');
          } catch (error) {
            console.error('[Editor] Error general al cargar plugins:', error);
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

        // Registrar el editor con el servicio puente
        GrapesJSBridgeService.registerEditor(editor);
        
        // Si hay un projectId, registrarlo también
        if (projectId) {
          GrapesJSBridgeService.registerProject(projectId);
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

    // Función para abrir diálogo de importación
    const openImportDialog = () => {
      if (!editorRefInternal.current) return;
      
      // Crear modal
      const modalEl = document.createElement('div');
      modalEl.className = 'gjs-mdl-dialog gjs-one-bg gjs-two-color import-dialog';
      modalEl.innerHTML = `
        <div class="gjs-mdl-header">
          <div class="gjs-mdl-title">Importar Imagen/XML</div>
          <div class="gjs-mdl-btn-close" id="gjs-mdl-btn-close">×</div>
        </div>
        <div class="gjs-mdl-content">
          <div class="import-container">
            <div class="import-tabs">
              <button id="tab-image" class="import-tab active">Imagen</button>
              <button id="tab-xml" class="import-tab">XML</button>
            </div>
            
            <div id="image-content" class="tab-content">
              <p>Selecciona o arrastra una imagen para convertirla en un componente editable</p>
              <input type="file" id="image-upload" accept="image/*" />
              <div id="image-preview" class="preview-container"></div>
            </div>
            
            <div id="xml-content" class="tab-content" style="display:none;">
              <p>Selecciona o arrastra un archivo XML para convertirlo en componentes</p>
              <input type="file" id="xml-upload" accept=".xml" />
              <div id="xml-preview" class="preview-container"></div>
            </div>
            
            <div class="import-actions">
              <button id="import-btn" disabled>Importar</button>
              <button id="cancel-btn">Cancelar</button>
            </div>
          </div>
        </div>
      `;
      
      // Estilos para el modal
      const styleEl = document.createElement('style');
      styleEl.innerHTML = `
        .import-container { padding: 20px; }
        .import-tabs { display: flex; margin-bottom: 15px; }
        .import-tab { 
          flex: 1; 
          padding: 8px; 
          border: none; 
          background: none; 
          border-bottom: 2px solid transparent; 
          cursor: pointer;
        }
        .import-tab.active { 
          border-bottom: 2px solid #4e88f1; 
          font-weight: bold; 
        }
        .tab-content { margin-bottom: 20px; }
        .preview-container { 
          min-height: 150px; 
          border: 2px dashed #ccc; 
          margin-top: 10px; 
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .preview-container img { max-width: 100%; max-height: 200px; }
        .import-actions { 
          display: flex; 
          justify-content: flex-end;
          gap: 10px; 
        }
        .import-actions button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        #import-btn {
          background: #4e88f1;
          color: white;
        }
        #import-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
        }
        #cancel-btn {
          background: #f1f1f1;
        }
        input[type="file"] {
          margin: 10px 0;
          width: 100%;
        }
      `;
      
      // Añadir modal al DOM
      document.body.appendChild(styleEl);
      document.body.appendChild(modalEl);
      
      // Inicializar variables para almacenar archivos
      let selectedFile: File | null = null;
      let fileType: 'image' | 'xml' = 'image';
      
      // Elementos del DOM
      const importBtn = modalEl.querySelector('#import-btn') as HTMLButtonElement;
      const cancelBtn = modalEl.querySelector('#cancel-btn') as HTMLButtonElement;
      const closeBtn = modalEl.querySelector('#gjs-mdl-btn-close') as HTMLElement;
      const imageTab = modalEl.querySelector('#tab-image') as HTMLButtonElement;
      const xmlTab = modalEl.querySelector('#tab-xml') as HTMLButtonElement;
      const imageContent = modalEl.querySelector('#image-content') as HTMLElement;
      const xmlContent = modalEl.querySelector('#xml-content') as HTMLElement;
      const imageUpload = modalEl.querySelector('#image-upload') as HTMLInputElement;
      const xmlUpload = modalEl.querySelector('#xml-upload') as HTMLInputElement;
      const imagePreview = modalEl.querySelector('#image-preview') as HTMLElement;
      const xmlPreview = modalEl.querySelector('#xml-preview') as HTMLElement;
      
      // Cambiar entre pestañas
      imageTab.addEventListener('click', () => {
        imageTab.classList.add('active');
        xmlTab.classList.remove('active');
        imageContent.style.display = 'block';
        xmlContent.style.display = 'none';
        fileType = 'image';
        updateImportButton();
      });
      
      xmlTab.addEventListener('click', () => {
        xmlTab.classList.add('active');
        imageTab.classList.remove('active');
        xmlContent.style.display = 'block';
        imageContent.style.display = 'none';
        fileType = 'xml';
        updateImportButton();
      });
      
      // Manejar selección de imágenes
      imageUpload.addEventListener('change', (e) => {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
          selectedFile = input.files[0];
          
          // Mostrar vista previa
          const reader = new FileReader();
          reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target?.result}" alt="Vista previa">`;
          };
          reader.readAsDataURL(selectedFile);
          
          updateImportButton();
        }
      });
      
      // Manejar selección de XML
      xmlUpload.addEventListener('change', (e) => {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
          selectedFile = input.files[0];
          
          // Mostrar vista previa simple
          xmlPreview.innerHTML = `<div>Archivo seleccionado: ${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)</div>`;
          
          // Vista previa del contenido
          const reader = new FileReader();
          reader.onload = (e) => {
            const content = e.target?.result as string;
            // Mostrar los primeros 200 caracteres
            if (content) {
              xmlPreview.innerHTML += `<pre style="margin-top:10px;overflow:auto;max-height:150px;background:#f5f5f5;padding:5px;font-size:12px">${content.substring(0, 200)}${content.length > 200 ? '...' : ''}</pre>`;
            }
          };
          reader.readAsText(selectedFile);
          
          updateImportButton();
        }
      });
      
      // Actualizar estado del botón de importar
      const updateImportButton = () => {
        importBtn.disabled = !selectedFile;
      };
      
      // Cerrar modal
      const closeModal = () => {
        document.body.removeChild(modalEl);
        document.body.removeChild(styleEl);
      };
      
      // Eventos para cerrar
      closeBtn.addEventListener('click', closeModal);
      cancelBtn.addEventListener('click', closeModal);
      
      // Evento de importación
      importBtn.addEventListener('click', async () => {
        if (!selectedFile || !editorRefInternal.current) return;
        
        try {
          importBtn.textContent = 'Procesando...';
          importBtn.disabled = true;
          
          if (fileType === 'image') {
            // Procesar imagen - mejorado para descomponer en componentes
            const reader = new FileReader();
            reader.onload = (e) => {
              const imgSrc = e.target?.result as string;
              
              // Crear componente de imagen con controles
              editorRefInternal.current?.addComponents(`
                <section class="imported-image-container" data-gjs-type="section" data-gjs-name="Imagen Importada">
                  <div class="image-wrapper" data-gjs-type="div" data-gjs-name="Contenedor de Imagen">
                    <img src="${imgSrc}" alt="${selectedFile?.name || 'Imagen importada'}" data-gjs-type="image" data-gjs-name="Imagen" data-gjs-draggable="true" data-gjs-resizable="true"/>
                  </div>
                  <div class="image-caption" data-gjs-type="text" data-gjs-name="Leyenda">
                    Imagen importada: ${selectedFile?.name || 'Sin nombre'}
                  </div>
                </section>
              `);
              
              // Añadir estilos al componente
              editorRefInternal.current?.addStyle(`
                .imported-image-container {
                  margin: 15px 0;
                  text-align: center;
                }
                .image-wrapper {
                  display: inline-block;
                  max-width: 100%;
                  position: relative;
                }
                .image-caption {
                  margin-top: 8px;
                  font-size: 0.9em;
                  color: #666;
                }
              `);
              
              // Cerrar modal después de importar
              closeModal();
            };
            reader.readAsDataURL(selectedFile);
          } else if (fileType === 'xml') {
            // Procesar XML mediante API de IA - mejorado para asegurar que los componentes se generen
            const formData = new FormData();
            formData.append('xmlFile', selectedFile);
            formData.append('projectId', projectId || 'default');
            
            try {
              const response = await fetch('/api/ai/convert-xml-to-components', {
                method: 'POST',
                body: formData
              });
              
              if (!response.ok) throw new Error('Error al procesar XML');
              
              const data = await response.json();
              
              // Asegurar que data.components exista
              if (!data.components || typeof data.components !== 'string' || data.components.trim() === '') {
                throw new Error('No se recibieron componentes válidos del API');
              }
              
              // Crear nueva página con los componentes generados
              if (editorRefInternal.current.Pages) {
                // Crear página nueva para los componentes
                const pageName = selectedFile.name.replace('.xml', '');
                const pageId = `page-xml-${Date.now()}`;
                
                editorRefInternal.current.Pages.add({
                  id: pageId,
                  name: pageName
                });
                
                // Añadir componentes a la página - mejorado para asegurar que se aplican
                setTimeout(() => {
                  // Seleccionar la página recién creada
                  editorRefInternal.current?.Pages.select(pageId);
                  
                  // Limpiar cualquier componente existente
                  editorRefInternal.current?.setComponents('');
                  
                  console.log('[XML Import] Componentes a insertar:', data.components);
                  
                  // Añadir componentes - con verificación
                  try {
                    editorRefInternal.current?.addComponents(data.components);
                  } catch (err) {
                    console.error('[XML Import] Error al añadir componentes:', err);
                    // Intento alternativo con setComponents
                    editorRefInternal.current?.setComponents(data.components);
                  }
                  
                  // Estilo personalizado si existe
                  if (data.styles) {
                    try {
                      editorRefInternal.current?.setStyle(data.styles);
                    } catch (styleErr) {
                      console.error('[XML Import] Error al aplicar estilos:', styleErr);
                    }
                  }
                  
                  // Forzar actualización del canvas
                  editorRefInternal.current?.refresh();
                  
                  // Mensaje de éxito
                  alert(`Archivo XML importado como componentes en la página "${pageName}"`);
                }, 300);
              } else {
                // Si no hay soporte para páginas, añadir directamente al canvas
                editorRefInternal.current?.setComponents(data.components);
                if (data.styles) {
                  editorRefInternal.current?.setStyle(data.styles);
                }
                editorRefInternal.current?.refresh();
              }
              
              closeModal();
            } catch (error) {
              console.error('Error al convertir XML:', error);
              alert('Error al procesar el archivo XML. Inténtalo de nuevo.');
              importBtn.textContent = 'Importar';
              importBtn.disabled = false;
            }
          }
        } catch (error) {
          console.error('Error en la importación:', error);
          alert('Error al importar el archivo. Inténtalo de nuevo.');
          importBtn.textContent = 'Importar';
          importBtn.disabled = false;
        }
      });
      
      // Funcionalidad de arrastrar y soltar
      [imagePreview, xmlPreview].forEach(container => {
        container.addEventListener('dragover', (e) => {
          e.preventDefault();
          container.style.borderColor = '#4e88f1';
          container.style.backgroundColor = 'rgba(78, 136, 241, 0.1)';
        });
        
        container.addEventListener('dragleave', () => {
          container.style.borderColor = '#ccc';
          container.style.backgroundColor = 'transparent';
        });
        
        container.addEventListener('drop', (e) => {
          e.preventDefault();
          container.style.borderColor = '#ccc';
          container.style.backgroundColor = 'transparent';
          
          if (e.dataTransfer?.files.length) {
            const file = e.dataTransfer.files[0];
            
            // Verificar tipo de archivo según pestaña activa
            if (fileType === 'image' && file.type.startsWith('image/')) {
              imageUpload.files = e.dataTransfer.files;
              const event = new Event('change', { bubbles: true });
              imageUpload.dispatchEvent(event);
            } else if (fileType === 'xml' && file.name.endsWith('.xml')) {
              xmlUpload.files = e.dataTransfer.files;
              const event = new Event('change', { bubbles: true });
              xmlUpload.dispatchEvent(event);
            } else {
              alert(`Por favor, arrastra un archivo ${fileType === 'image' ? 'de imagen' : 'XML'} válido.`);
            }
          }
        });
      });
    };

    // Variable para manejar debounce de guardado
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

    // Efecto para inicializar el servicio de sincronización de páginas
    useEffect(() => {
      if (editorRefInternal.current && socket && projectId) {
        // Inicializar el servicio de sincronización de páginas
        const pagesSyncService = PagesSyncService.getInstance();
        const userId = typeof window !== 'undefined' ? window.userId : undefined;
        pagesSyncService.initialize(socket, editorRefInternal.current, projectId, userId);
        
        console.log('[Editor] Servicio de sincronización de páginas inicializado');
      }
    }, [editorRefInternal.current, socket, projectId]);

    // Agregar manejadores para sincronización automática de cambios
    useEffect(() => {
      if (!editorRefInternal.current) return;
      
      const editor = editorRefInternal.current;
      
      // Guardar automáticamente al cambiar de página
      const handlePageSelect = () => {
        // Esperar a que el canvas se actualice
        setTimeout(() => {
          const pagesSyncService = PagesSyncService.getInstance();
          if (pagesSyncService.isReady()) {
            pagesSyncService.saveCurrentPage();
          }
        }, 100);
      };
      
      // Manejar eventos de cambio significativos
      const handleComponentChange = () => {
        // Throttle para no enviar demasiados eventos
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
        
        debounceTimeout.current = setTimeout(() => {
          const pagesSyncService = PagesSyncService.getInstance();
          if (pagesSyncService.isReady()) {
            pagesSyncService.saveCurrentPage();
          }
        }, 1000); // Esperar 1 segundo de inactividad
      };
      
      editor.on('page:select', handlePageSelect);
      editor.on('component:update:components', handleComponentChange);
      editor.on('component:update:content', handleComponentChange);
      editor.on('component:update:style', handleComponentChange);
      editor.on('component:update', handleComponentChange);
      
      return () => {
        editor.off('page:select', handlePageSelect);
        editor.off('component:update:components', handleComponentChange);
        editor.off('component:update:content', handleComponentChange);
        editor.off('component:update:style', handleComponentChange);
        editor.off('component:update', handleComponentChange);
        
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
      };
    }, [editorRefInternal.current]);

    // Renderizar la interfaz de usuario
    return (
      <div className="simple-grapesjs-editor" data-testid="gjs-editor">
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
                  title="Importar Imagen/XML"
                  onClick={() => openImportDialog()}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" /></svg>}
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
              
              {process.env.NODE_ENV === 'development' && (
                <ToolbarButton
                  id="debug-pages"
                  title="Depurar páginas"
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
                  icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20,8h-2.81c-0.45-0.78-1.07-1.45-1.82-1.96L17,4.41L15.59,3l-2.17,2.17C12.96,5.06,12.49,5,12,5c-0.49,0-0.96,0.06-1.41,0.17 L8.41,3L7,4.41l1.62,1.63C7.88,6.55,7.26,7.22,6.81,8H4v2h2.09c-0.05,0.33-0.09,0.66-0.09,1v1H4v2h2v1c0,0.34,0.04,0.67,0.09,1H4v2h2.81 c1.04,1.79,2.97,3,5.19,3s4.15-1.21,5.19-3H20v-2h-2.09c0.05-0.33,0.09-0.66,0.09-1v-1h2v-2h-2v-1c0-0.34-0.04-0.67-0.09-1H20V8z M14,16h-4v-2h4V16z M14,12h-4v-2h4V12z"/></svg>}
                />
              )}
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
          .simple-grapesjs-editor {
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
