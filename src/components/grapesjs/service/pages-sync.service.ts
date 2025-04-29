'use client';

import { Socket } from 'socket.io-client';
import { Editor, Page } from 'grapesjs';

// Tipos para páginas
export interface PageData {
  id: string;
  name: string;
  html?: string;
  css?: string;
  components?: any;
  isDefault?: boolean;
}

// Eventos de página
export interface PageEventData {
  pageId: string;
  pageName?: string;
  userId?: string;
  projectId?: string;
  pageData?: PageData;
}

/**
 * Servicio singleton para sincronizar páginas entre diferentes instancias del editor
 */
class PagesSyncService {
  private static instance: PagesSyncService;
  private socket: Socket | null = null;
  private editor: Editor | null = null;
  private projectId: string | null = null;
  private userId: string | null = null;
  private initialized: boolean = false;
  private isCurrentlyLoading: boolean = false;
  private lastSynced: { [pageId: string]: number } = {};

  /**
   * Constructor privado para patrón singleton
   */
  private constructor() {}

  /**
   * Obtener la instancia única del servicio
   */
  public static getInstance(): PagesSyncService {
    if (!PagesSyncService.instance) {
      PagesSyncService.instance = new PagesSyncService();
    }
    return PagesSyncService.instance;
  }

  /**
   * Inicializar el servicio con las dependencias necesarias
   */
  public initialize(socket: Socket, editor: Editor, projectId: string, userId?: string): void {
    this.socket = socket;
    this.editor = editor;
    this.projectId = projectId;
    this.userId = userId || 'anonymous';
    this.initialized = true;
    this.setupEventListeners();
    
    console.log('[PagesSyncService] Inicializado con projectId:', projectId, 'userId:', this.userId);
  }

  /**
   * Verificar si el servicio está correctamente inicializado
   */
  public isReady(): boolean {
    return this.initialized && !!this.socket && !!this.editor && !!this.projectId;
  }

  /**
   * Configurar los listeners de eventos de socket
   */
  private setupEventListeners(): void {
    if (!this.socket || !this.editor) return;

    // Escuchar actualizaciones de páginas
    this.socket.on('page:updated', this.handlePageUpdated);
    
    // Escuchar eliminaciones de páginas
    this.socket.on('page:deleted', this.handlePageDeleted);
    
    // Escuchar creación de páginas
    this.socket.on('page:created', this.handlePageCreated);
    
    console.log('[PagesSyncService] Listeners de eventos configurados');
  }

  /**
   * Manejar la actualización de una página desde otro cliente
   */
  private handlePageUpdated = (data: any) => {
    if (!this.editor || this.isCurrentlyLoading) return;
    
    const { projectId, pageId, content, updatedBy } = data;
    
    // Ignorar actualizaciones del mismo usuario o de otro proyecto
    if (updatedBy === this.userId || projectId !== this.projectId) return;
    
    console.log(`[PagesSyncService] Recibida actualización para página ${pageId} de ${updatedBy}`);
    
    const currentPage = this.editor.Pages.getSelected();
    const currentPageId = currentPage?.get('id');
    
    // Si es la página actual, actualizar su contenido
    if (currentPageId === pageId) {
      try {
        this.isCurrentlyLoading = true;
        this.editor.setComponents(content.html || '');
        this.editor.setStyle(content.css || '');
        console.log(`[PagesSyncService] Página ${pageId} actualizada con éxito`);
      } catch (error) {
        console.error('[PagesSyncService] Error al actualizar la página:', error);
      } finally {
        this.isCurrentlyLoading = false;
      }
    } else {
      // Si no es la página actual, actualizar silenciosamente en el modelo
      const page = this.editor.Pages.get(pageId);
      if (page) {
        page.set('html', content.html || '');
        page.set('css', content.css || '');
        console.log(`[PagesSyncService] Actualizado silenciosamente el modelo de la página ${pageId}`);
      }
    }
  }

  /**
   * Manejar la eliminación de una página desde otro cliente
   */
  private handlePageDeleted = (data: any) => {
    if (!this.editor) return;
    
    const { projectId, pageId, deletedBy } = data;
    
    // Ignorar eliminaciones del mismo usuario o de otro proyecto
    if (deletedBy === this.userId || projectId !== this.projectId) return;
    
    console.log(`[PagesSyncService] Recibida eliminación para página ${pageId} de ${deletedBy}`);
    
    const page = this.editor.Pages.get(pageId);
    if (page) {
      const isSelected = this.editor.Pages.getSelected()?.get('id') === pageId;
      
      if (isSelected) {
        // Si es la página actual, seleccionar otra antes de eliminar
        const pages = this.editor.Pages.getAll();
        const otherPage = pages.find(p => p.get('id') !== pageId);
        if (otherPage) {
          this.editor.Pages.select(otherPage);
        }
      }
      
      // Eliminar la página
      this.editor.Pages.remove(pageId);
      console.log(`[PagesSyncService] Página ${pageId} eliminada con éxito`);
    }
  }

  /**
   * Manejar la creación de una página desde otro cliente
   */
  private handlePageCreated = (data: any) => {
    if (!this.editor) return;
    
    const { projectId, page, createdBy } = data;
    
    // Ignorar creaciones del mismo usuario o de otro proyecto
    if (createdBy === this.userId || projectId !== this.projectId) return;
    
    console.log(`[PagesSyncService] Recibida creación de página ${page.id} de ${createdBy}`);
    
    try {
      // Verificar si la página ya existe
      const existingPage = this.editor.Pages.get(page.id);
      if (existingPage) {
        console.log(`[PagesSyncService] La página ${page.id} ya existe, no se creará duplicada`);
        return;
      }
      
      // Crear la nueva página
      this.editor.Pages.add({
        id: page.id,
        name: page.name,
        html: page.html || '',
        css: page.css || '',
      });
      
      console.log(`[PagesSyncService] Página ${page.id} creada con éxito`);
    } catch (error) {
      console.error('[PagesSyncService] Error al crear la página:', error);
    }
  }

  /**
   * Guardar la página actual en el servidor
   */
  public saveCurrentPage(): void {
    if (!this.isReady() || this.isCurrentlyLoading) return;
    
    const editor = this.editor!;
    const currentPage = editor.Pages.getSelected();
    
    if (!currentPage) {
      console.error('[PagesSyncService] No hay página seleccionada para guardar');
      return;
    }
    
    const pageId = currentPage.get('id');
    
    // Evitar guardar demasiado frecuentemente la misma página
    const now = Date.now();
    const lastSave = this.lastSynced[pageId] || 0;
    if (now - lastSave < 1000) { // No guardar más de una vez por segundo
      return;
    }
    
    // Actualizar timestamp
    this.lastSynced[pageId] = now;
    
    // Obtener el contenido actual
    const html = editor.getHtml();
    const css = editor.getCss();
    
    // Actualizar el modelo de la página
    currentPage.set('html', html);
    currentPage.set('css', css);
    
    // Enviar al servidor
    if (this.socket) {
      this.socket.emit('page:update', {
        projectId: this.projectId,
        pageId: pageId,
        content: { html, css },
        updatedBy: this.userId,
        timestamp: now,
      });
      
      console.log(`[PagesSyncService] Página ${pageId} guardada y sincronizada`);
    }
  }

  /**
   * Crear una nueva página y sincronizarla
   */
  public createPage(name: string): string | null {
    if (!this.isReady()) return null;
    
    const editor = this.editor!;
    
    try {
      // Generar un ID único para la página
      const pageId = `page-${Date.now()}`;
      
      // Crear la página en el editor
      editor.Pages.add({
        id: pageId,
        name: name,
        html: '',
        css: '',
      });
      
      // Seleccionar la nueva página
      const newPage = editor.Pages.get(pageId);
      if (newPage) {
        editor.Pages.select(newPage);
      }
      
      // Notificar al servidor
      if (this.socket) {
        this.socket.emit('page:create', {
          projectId: this.projectId,
          page: {
            id: pageId,
            name: name,
            html: '',
            css: '',
          },
          createdBy: this.userId,
          timestamp: Date.now(),
        });
        
        console.log(`[PagesSyncService] Nueva página ${pageId} creada y sincronizada`);
      }
      
      return pageId;
    } catch (error) {
      console.error('[PagesSyncService] Error al crear la página:', error);
      return null;
    }
  }

  /**
   * Eliminar una página y sincronizar la eliminación
   */
  public deletePage(pageId: string): boolean {
    if (!this.isReady()) return false;
    
    const editor = this.editor!;
    
    try {
      const page = editor.Pages.get(pageId);
      if (!page) {
        console.error(`[PagesSyncService] La página ${pageId} no existe`);
        return false;
      }
      
      // Verificar si es la única página
      const pages = editor.Pages.getAll();
      if (pages.length <= 1) {
        console.error('[PagesSyncService] No se puede eliminar la única página del proyecto');
        return false;
      }
      
      // Si es la página actual, seleccionar otra antes de eliminar
      const isSelected = editor.Pages.getSelected()?.get('id') === pageId;
      if (isSelected) {
        const otherPage = pages.find(p => p.get('id') !== pageId);
        if (otherPage) {
          editor.Pages.select(otherPage);
        }
      }
      
      // Eliminar la página
      editor.Pages.remove(pageId);
      
      // Notificar al servidor
      if (this.socket) {
        this.socket.emit('page:delete', {
          projectId: this.projectId,
          pageId: pageId,
          deletedBy: this.userId,
          timestamp: Date.now(),
        });
        
        console.log(`[PagesSyncService] Página ${pageId} eliminada y sincronizada`);
      }
      
      return true;
    } catch (error) {
      console.error('[PagesSyncService] Error al eliminar la página:', error);
      return false;
    }
  }

  /**
   * Destruir la instancia y limpiar recursos
   */
  public destroy(): void {
    if (this.socket) {
      this.socket.off('page:updated', this.handlePageUpdated);
      this.socket.off('page:deleted', this.handlePageDeleted);
      this.socket.off('page:created', this.handlePageCreated);
    }
    
    this.socket = null;
    this.editor = null;
    this.projectId = null;
    this.userId = null;
    this.initialized = false;
    this.isCurrentlyLoading = false;
    this.lastSynced = {};
    
    console.log('[PagesSyncService] Servicio destruido y recursos liberados');
  }
}

export default PagesSyncService; 