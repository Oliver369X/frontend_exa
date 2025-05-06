/**
 * Servicio puente para comunicar GrapesJS con otros componentes de la aplicación
 */

import { GrapesJSParserService } from '../../ai-code-generation/services/grapesjs-parser.service';
import { Socket } from 'socket.io-client';

// Definir tipos para la comunicación entre GrapesJS y otros componentes
export interface GrapesJSPageData {
  id: string;
  name: string;
  html?: string;
  css?: string;
  components?: Record<string, unknown>;
}

// Definir una interfaz para el editor GrapesJS
interface GrapesJSEditor {
  getComponents: () => unknown;
  getHtml: () => string;
  getCss: (options?: unknown) => string;
  getJs?: () => string;
  getStyle?: () => unknown[];
  Commands: {
    run: (cmd: string) => unknown;
    stop: (cmd: string) => unknown;
  };
  UndoManager: {
    undo: () => void;
    redo: () => void;
    clear: () => void;
  };
  Pages?: {
    getAll: () => Array<{
      id: string;
      get: (prop: string) => unknown;
      getMainComponent?: () => {
        toHTML: () => string;
        toJSON: () => Record<string, unknown>;
      };
    }>;
  };
}

// Definir las acciones disponibles para la interfaz global
export interface GrapesJSGlobalActions {
  getContent: () => Record<string, unknown>;
  getHtml: () => string;
  getCss: () => string;
  getJs: () => string;
  getAllPages: () => GrapesJSPageData[];
  showStyles: () => void;
  showLayers: () => void;
  showTraits: () => void;
  toggleComponentOutline: () => void;
  togglePreview: () => void;
  openPagesDialog: () => void;
  exportHTML: () => void;
  setDeviceDesktop: () => void;
  setDeviceTablet: () => void;
  setDeviceMobile: () => void;
}

// Servicio para conectar todos los componentes GrapesJS del proyecto
export class GrapesJSBridgeService {
  // Almacena la última instancia disponible del editor
  private static editorInstance: GrapesJSEditor | null = null;
  
  // Almacena los IDs de todos los proyectos activos
  private static activeProjects: Set<string> = new Set();
  
  // Registra un proyecto GrapesJS
  static registerProject(projectId: string): void {
    this.activeProjects.add(projectId);
  }
  
  // Registra la instancia del editor
  static registerEditor(editor: GrapesJSEditor): void {
    this.editorInstance = editor;
    
    // Extender window para acceso global
    if (typeof window !== 'undefined') {
      // Implementar las acciones para la interfaz global
      const actions: GrapesJSGlobalActions = {
        getContent: this.getContent.bind(this),
        getHtml: this.getHtml.bind(this),
        getCss: this.getCss.bind(this),
        getJs: this.getJs.bind(this),
        getAllPages: this.getAllPages.bind(this),
        
        // Implementaciones de las acciones faltantes
        showStyles: () => {
          console.log('[GrapesJS] Mostrando panel de estilos');
          // Tu implementación aquí...
        },
        showLayers: () => {
          console.log('[GrapesJS] Mostrando panel de capas');
          // Tu implementación aquí...
        },
        showTraits: () => {
          console.log('[GrapesJS] Mostrando panel de atributos');
          // Tu implementación aquí...
        },
        toggleComponentOutline: () => {
          console.log('[GrapesJS] Alternando bordes de componentes');
          // Tu implementación aquí...
        },
        togglePreview: () => {
          console.log('[GrapesJS] Alternando vista previa');
          if (this.editorInstance) {
            this.editorInstance.Commands.run('preview');
          }
        },
        openPagesDialog: () => {
          console.log('[GrapesJS] Abriendo diálogo de páginas');
          if (this.editorInstance) {
            // Intentar usar el comando específico para páginas si existe
            try {
              this.editorInstance.Commands.run('open-pages');
              return;
            } catch (e) {
              console.log('Comando open-pages no disponible, usando alternativa');
            }
            
            // Solución alternativa con diálogo personalizado
            const pages = this.getAllPages();
            const editorEl = document.querySelector('.gjs-editor');
            
            // Crear diálogo modal
            const modalEl = document.createElement('div');
            modalEl.className = 'gjs-mdl-dialog gjs-one-bg gjs-two-color';
            modalEl.innerHTML = `
              <div class="gjs-mdl-header">
                <div class="gjs-mdl-title">Administrar Páginas</div>
                <div class="gjs-mdl-btn-close" id="gjs-mdl-btn-close">×</div>
              </div>
              <div class="gjs-mdl-content">
                <div class="pages-container">
                  <ul class="pages-list">
                    ${pages.map(page => `
                      <li data-page-id="${page.id}">
                        <span class="page-name">${page.name}</span>
                        <span class="page-actions">
                          <button class="page-edit-btn">Editar</button>
                          <button class="page-delete-btn">Eliminar</button>
                        </span>
                      </li>
                    `).join('')}
                  </ul>
                  <button id="add-page-btn" class="add-page-btn">Añadir página</button>
                </div>
              </div>
            `;
            
            // Añadir estilos básicos
            const styleEl = document.createElement('style');
            styleEl.innerHTML = `
              .pages-container { padding: 20px; }
              .pages-list { list-style: none; padding: 0; margin-bottom: 15px; }
              .pages-list li { 
                display: flex; 
                justify-content: space-between; 
                padding: 8px 10px; 
                margin-bottom: 5px; 
                background: rgba(0,0,0,0.05); 
                border-radius: 3px;
              }
              .page-actions { display: flex; gap: 5px; }
              .page-edit-btn, .page-delete-btn, .add-page-btn {
                padding: 5px 10px;
                background: #4e88f1;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
              }
              .page-delete-btn { background: #f14e4e; }
              .add-page-btn { width: 100%; }
            `;
            
            // Montar el modal
            document.body.appendChild(styleEl);
            document.body.appendChild(modalEl);
            
            // Eventos
            const closeBtn = modalEl.querySelector('#gjs-mdl-btn-close');
            closeBtn?.addEventListener('click', () => {
              document.body.removeChild(modalEl);
              document.body.removeChild(styleEl);
            });
            
            // Añadir página
            const addBtn = modalEl.querySelector('#add-page-btn');
            addBtn?.addEventListener('click', () => {
              const pageName = prompt('Nombre de la página:');
              if (pageName && this.editorInstance?.Pages) {
                try {
                  // Usar método directo si está disponible
                  this.editorInstance.Pages.add({ name: pageName });
                  document.body.removeChild(modalEl);
                  document.body.removeChild(styleEl);
                  this.openPagesDialog(); // Reabrir con la nueva página
                } catch (err) {
                  console.error('Error al añadir página:', err);
                  alert('Error al añadir página. Inténtalo de nuevo.');
                }
              }
            });
            
            // Evento para editar y eliminar páginas
            const pagesList = modalEl.querySelector('.pages-list');
            pagesList?.addEventListener('click', (e) => {
              const target = e.target as HTMLElement;
              if (!target) return;
              
              const pageItem = target.closest('li');
              if (!pageItem) return;
              
              const pageId = pageItem.getAttribute('data-page-id');
              if (!pageId) return;
              
              // Editar página
              if (target.classList.contains('page-edit-btn')) {
                const newName = prompt('Nuevo nombre:', pageItem.querySelector('.page-name')?.textContent || '');
                if (newName && this.editorInstance?.Pages) {
                  const page = this.editorInstance.Pages.getAll().find(p => p.get('id') === pageId);
                  if (page) {
                    page.set('name', newName);
                    document.body.removeChild(modalEl);
                    document.body.removeChild(styleEl);
                    this.openPagesDialog(); // Reabrir con el nombre actualizado
                  }
                }
              }
              
              // Eliminar página
              if (target.classList.contains('page-delete-btn')) {
                const confirm = window.confirm('¿Estás seguro de eliminar esta página?');
                if (confirm && this.editorInstance?.Pages) {
                  try {
                    // No permitir eliminar si solo hay una página
                    if (this.editorInstance.Pages.getAll().length <= 1) {
                      alert('No puedes eliminar la única página del proyecto');
                      return;
                    }
                    
                    this.editorInstance.Pages.remove(pageId);
                    document.body.removeChild(modalEl);
                    document.body.removeChild(styleEl);
                    this.openPagesDialog(); // Reabrir con la página eliminada
                  } catch (err) {
                    console.error('Error al eliminar página:', err);
                    alert('Error al eliminar página. Inténtalo de nuevo.');
                  }
                }
              }
            });
          }
        },
        exportHTML: () => {
          console.log('[GrapesJS] Exportando HTML');
          if (this.editorInstance) {
            const html = this.getHtml();
            const css = this.getCss();
            
            // Crear un objeto de texto con el HTML y CSS
            const blob = new Blob([
              `<!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <title>Exported Project</title>
                <style>${css}</style>
              </head>
              <body>
                ${html}
              </body>
              </html>`
            ], {type: 'text/html'});
            
            // Crear URL para descargar
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'project-export.html';
            a.click();
            URL.revokeObjectURL(url);
          }
        },
        setDeviceDesktop: () => {
          console.log('[GrapesJS] Cambiando a vista de escritorio');
          // Tu implementación aquí...
        },
        setDeviceTablet: () => {
          console.log('[GrapesJS] Cambiando a vista de tablet');
          // Tu implementación aquí...
        },
        setDeviceMobile: () => {
          console.log('[GrapesJS] Cambiando a vista móvil');
          // Tu implementación aquí...
        }
      };
      
      window.grapesJsActions = actions;
    }
  }
  
  // Obtener el contenido completo del editor
  static getContent(): Record<string, unknown> {
    if (!this.editorInstance) return {};
    
    try {
      // Obtener contenido del editor activo
      const html = this.getHtml();
      const css = this.getCss();
      const js = this.getJs();
      const pages = this.getAllPages();
      
      // Obtener componentes y su estructura
      const components = this.editorInstance.getComponents();
      const allComponents = components ? components.models || [] : [];
      
      // Crear objeto de datos completo
      return {
        html,
        css,
        js,
        components: allComponents,
        pages,
        projectStructure: GrapesJSParserService.extractProjectData({
          components: allComponents,
          styles: this.editorInstance.getStyle?.() || []
        })
      };
    } catch (error) {
      console.error('Error obteniendo contenido de GrapesJS:', error);
      return {};
    }
  }
  
  // Obtener HTML del editor
  static getHtml(): string {
    if (!this.editorInstance) return '';
    return this.editorInstance.getHtml() || '';
  }
  
  // Obtener CSS del editor
  static getCss(): string {
    if (!this.editorInstance) return '';
    return this.editorInstance.getCss() || '';
  }
  
  // Obtener JavaScript del editor
  static getJs(): string {
    if (!this.editorInstance) return '';
    return this.editorInstance.getJs?.() || '';
  }
  
  // Obtener todas las páginas del proyecto
  static getAllPages(): GrapesJSPageData[] {
    if (!this.editorInstance) return [];
    
    try {
      // Intentar obtener páginas del plugin pageManager
      const pageManager = this.editorInstance.Pages;
      if (!pageManager) return [];
      
      return pageManager.getAll().map((page: any) => ({
        id: page.id,
        name: page.get('name'),
        html: page.getMainComponent?.() ? page.getMainComponent().toHTML() : '',
        css: this.editorInstance?.getCss({ component: page.getMainComponent?.() }) || ''
      }));
    } catch (error) {
      console.error('Error obteniendo páginas de GrapesJS:', error);
      return [];
    }
  }

  static async getProjectStructure() {
    if (!window.grapesJsActions) return null;
    
    // Obtener páginas y componentes
    const pages = window.grapesJsActions.getAllPages?.() || [];
    const design = window.grapesJsActions.getContent?.() || {};
    
    return {
      pages,
      components: design.components || [],
      styles: design.styles || [],
      html: window.grapesJsActions.getHtml?.() || '',
      css: window.grapesJsActions.getCss?.() || ''
    };
  }
}

// Garantizar acceso global desde window
declare global {
  interface Window {
    grapesJsActions: GrapesJSGlobalActions;
    currentProjectId?: string;
    socketInstance?: Socket;
  }
}
