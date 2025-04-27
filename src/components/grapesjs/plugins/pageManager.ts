import { Plugin } from 'grapesjs';
import { Editor, Page } from 'grapesjs';
import { Socket } from 'socket.io-client';

// Interfaces para tipado
interface PageData {
  id: string;
  name: string;
  html?: string;
  css?: string;
  components?: Record<string, unknown>;
}

// Tipos de eventos de páginas
type PageEventData = {
  pageId: string;
  pageName?: string;
  userId?: string;
  timestamp?: number;
  projectId?: string;
  pageData?: PageData;
};

// Ampliamos la interfaz Window para incluir nuestras propiedades
declare global {
  interface Window {
    currentProjectId?: string;
    socketInstance?: Socket;
    syncPageSelection?: boolean; // Nueva bandera para controlar si la selección se sincroniza
  }
}

/**
 * Plugin para la gestión de páginas en GrapesJS
 * Añade un modal para crear, editar y eliminar páginas
 * Implementa soporte para colaboración en tiempo real mediante sockets
 */
const pageManagerPlugin: Plugin = (editor: Editor) => {
  // Verificar que el editor está correctamente inicializado
  if (!editor) {
    console.error('[PageManager] Error: Editor no está inicializado correctamente');
    return;
  }

  // Asegurarse de que Pages existe y está inicializado
  if (!editor.Pages) {
    console.error('[PageManager] Error: El módulo Pages no está disponible en esta instancia del editor');
    return;
  }

  // Verificar que los métodos esenciales existen
  const requiredMethods = ['getMain', 'getAll', 'add', 'remove', 'select'];
  const missingMethods = requiredMethods.filter(method => typeof editor.Pages[method as keyof typeof editor.Pages] !== 'function');
  
  if (missingMethods.length > 0) {
    console.error(`[PageManager] Error: Faltan los siguientes métodos en editor.Pages: ${missingMethods.join(', ')}`);
    return;
  }

  // Continuar con la inicialización del plugin
  console.log('[PageManager] Editor verificado, inicializando plugin...');

  // Banderas para control de sincronización
  let isApplyingRemoteUpdate = false;
  let isInitialLoad = true;
  let isSelectingPage = false;
  
  // Configuración de sincronización (por defecto desactivada)
  if (typeof window !== 'undefined' && window.syncPageSelection === undefined) {
    window.syncPageSelection = false; // Por defecto, no sincronizar selección
  }
  
  // Identificador para el proyecto actual
  const projectId = typeof window !== 'undefined' ? window.currentProjectId : undefined;
  const socketInstance = typeof window !== 'undefined' ? window.socketInstance : undefined;
  
  console.log('[PageManager] Inicializando plugin con projectId:', projectId);
  console.log('[PageManager] Socket disponible:', socketInstance ? 'Sí' : 'No');
  console.log('[PageManager] Sincronización de selección:', window.syncPageSelection ? 'Activada' : 'Desactivada');
  
  // Conjunto para páginas ya cargadas (evitar duplicados)
  const loadedPageIds = new Set<string>();
  // Conjunto para páginas eliminadas (evitar que reaparezcan)
  const deletedPageIds = new Set<string>();

  // Función para generar un ID único para páginas
  const generateUniqueId = (): string => {
    return `page-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  };

  // Configurar eventos del editor
  const setupPageSyncEvents = () => {
    // Escuchar cambios de páginas en el editor
    editor.Pages.getAll().forEach((page) => {
      const pageId = page.get('id') as string;
      loadedPageIds.add(pageId);
    });

    // Cuando se agrega una nueva página
    editor.on('page:add', (page) => {
      if (isApplyingRemoteUpdate) return;
      
      const pageId = page.get('id') as string;
      const pageName = page.get('name') as string;
      
      console.log(`[PageManager] Página agregada localmente: ${pageName} (${pageId})`);
      
      // Evitar guardar durante la carga inicial
      if (!isInitialLoad) {
        savePages();
        emitPageEvent('page:add', {
          pageId,
          pageName,
          pageData: serializePage(page)
        });
      }
    });

    // Cuando se elimina una página
    editor.on('page:remove', (page) => {
      if (isApplyingRemoteUpdate) return;
      
      const pageId = page.get('id') as string;
      const pageName = page.get('name') as string;
      
      console.log(`[PageManager] Página eliminada localmente: ${pageName} (${pageId})`);
      
      // Registrar la página como eliminada para evitar que reaparezca
      deletedPageIds.add(pageId);
      
      savePages();
      emitPageEvent('page:remove', { pageId, pageName });
    });

    // Cuando se actualiza una página
    editor.on('page:update', (page) => {
      if (isApplyingRemoteUpdate) return;
      
      const pageId = page.get('id') as string;
      const pageName = page.get('name') as string;
      
      console.log(`[PageManager] Página actualizada localmente: ${pageName} (${pageId})`);
      
      savePages();
      emitPageEvent('page:update', {
        pageId,
        pageName,
        pageData: serializePage(page)
      });
    });

    // Cuando se selecciona una página
    editor.on('page:select', (page) => {
      if (isApplyingRemoteUpdate || isSelectingPage) return;
      
      const pageId = page.get('id') as string;
      const pageName = page.get('name') as string;
      
      console.log(`[PageManager] Página seleccionada localmente: ${pageName} (${pageId})`);
      
      // Solo sincronizar selección si está activada la opción
      if (window.syncPageSelection) {
        emitPageEvent('page:select', { pageId, pageName });
      }
    });
  };

  // Configurar escucha de eventos de socket
  const setupSocketListeners = (socket: Socket) => {
    if (!socket) {
      console.warn('[PageManager] No se pudo configurar listeners: Socket no disponible');
      return;
    }

    console.log('[PageManager] Configurando listeners de socket para páginas');

    socket.on('page:add', (data: PageEventData) => {
      // Evitar aplicar eventos propios
      if (data.userId === getUserId()) return;
      
      console.log(`[PageManager] Recibido evento page:add remoto: página "${data.pageName}"`);
      
      // Verificar si ya tenemos esta página
      if (loadedPageIds.has(data.pageId)) {
        console.log(`[PageManager] La página ${data.pageId} ya está cargada, ignorando`);
        return;
      }
      
      // Verificar si la página está en la lista de eliminadas
      if (deletedPageIds.has(data.pageId)) {
        console.log(`[PageManager] La página ${data.pageId} fue eliminada localmente, ignorando`);
        return;
      }
      
      // Aplicar cambio remoto
      isApplyingRemoteUpdate = true;
      
      try {
        if (data.pageData) {
          editor.Pages.add({
            id: data.pageId,
            name: data.pageName || 'Nueva página',
            component: data.pageData.components || '',
            styles: data.pageData.css || ''
          });
          
          loadedPageIds.add(data.pageId);
          console.log(`[PageManager] Página "${data.pageName}" (${data.pageId}) agregada desde remoto`);
        } else {
          console.warn('[PageManager] Datos de página incompletos en evento page:add');
        }
      } catch (error) {
        console.error('[PageManager] Error al agregar página remota:', error);
      } finally {
        isApplyingRemoteUpdate = false;
        savePages(); // Guardar para persistencia local
      }
    });

    socket.on('page:remove', (data: PageEventData) => {
      // Evitar aplicar eventos propios
      if (data.userId === getUserId()) return;
      
      console.log(`[PageManager] Recibido evento page:remove remoto: página "${data.pageName}"`);
      
      isApplyingRemoteUpdate = true;
      
      try {
        const pageToRemove = editor.Pages.get(data.pageId);
        if (pageToRemove) {
          editor.Pages.remove(pageToRemove);
          loadedPageIds.delete(data.pageId);
          // Registrar la página como eliminada
          deletedPageIds.add(data.pageId);
          console.log(`[PageManager] Página "${data.pageName}" (${data.pageId}) eliminada desde remoto`);
        } else {
          console.warn(`[PageManager] No se encontró la página ${data.pageId} para eliminar`);
        }
      } catch (error) {
        console.error('[PageManager] Error al eliminar página remota:', error);
      } finally {
        isApplyingRemoteUpdate = false;
        savePages(); // Guardar para persistencia local
      }
    });

    socket.on('page:update', (data: PageEventData) => {
      // Evitar aplicar eventos propios
      if (data.userId === getUserId()) return;
      
      console.log(`[PageManager] Recibido evento page:update remoto: página "${data.pageName}"`);
      
      isApplyingRemoteUpdate = true;
      
      try {
        const pageToUpdate = editor.Pages.get(data.pageId);
        if (pageToUpdate && data.pageData) {
          if (data.pageName) {
            pageToUpdate.set('name', data.pageName);
          }
          if (data.pageData.components) {
            pageToUpdate.set('component', data.pageData.components);
          }
          if (data.pageData.css) {
            pageToUpdate.set('styles', data.pageData.css);
          }
          
          console.log(`[PageManager] Página "${data.pageName}" (${data.pageId}) actualizada desde remoto`);
        } else {
          console.warn(`[PageManager] No se encontró la página ${data.pageId} para actualizar`);
        }
      } catch (error) {
        console.error('[PageManager] Error al actualizar página remota:', error);
      } finally {
        isApplyingRemoteUpdate = false;
        savePages(); // Guardar para persistencia local
      }
    });

    socket.on('page:select', (data: PageEventData) => {
      // Evitar aplicar eventos propios
      if (data.userId === getUserId()) return;
      
      console.log(`[PageManager] Recibido evento page:select remoto: página "${data.pageName}"`);
      
      // Solo aplicar si la sincronización de selección está activada
      if (!window.syncPageSelection) {
        console.log('[PageManager] Sincronización de selección desactivada, ignorando selección remota');
        return;
      }
      
      isSelectingPage = true;
      
      try {
        const pageToSelect = editor.Pages.get(data.pageId);
        if (pageToSelect) {
          editor.Pages.select(pageToSelect);
          console.log(`[PageManager] Página "${data.pageName}" (${data.pageId}) seleccionada desde remoto`);
        } else {
          console.warn(`[PageManager] No se encontró la página ${data.pageId} para seleccionar`);
        }
      } catch (error) {
        console.error('[PageManager] Error al seleccionar página remota:', error);
      } finally {
        isSelectingPage = false;
      }
    });

    // Solicitar sincronización inicial de páginas al unirse
    socket.on('join:project', (data: { projectId: string }) => {
      console.log(`[PageManager] Unido al proyecto ${data.projectId}, solicitando sincronización inicial`);
      socket.emit('page:request-sync', { projectId: data.projectId });
    });

    // Recibir sincronización inicial de páginas
    socket.on('page:full-sync', (data: { pages: PageData[] }) => {
      console.log(`[PageManager] Recibida sincronización completa: ${data.pages.length} páginas`);
      
      isApplyingRemoteUpdate = true;
      isInitialLoad = true;
      
      try {
        // Verificar que editor.Pages existe
        if (!editor.Pages) {
          console.error('[PageManager] Error: editor.Pages no está definido');
          return;
        }

        // Verificar que getMain está disponible
        if (typeof editor.Pages.getMain !== 'function') {
          console.error('[PageManager] Error: editor.Pages.getMain no es una función');
          return;
        }

        // Limpiar páginas actuales excepto la predeterminada
        const defaultPage = editor.Pages.getMain();
        if (!defaultPage) {
          console.error('[PageManager] Error: No se pudo obtener la página principal');
          return;
        }
        
        const defaultPageId = defaultPage.get('id') as string;
        
        // Verificar que getAll está disponible
        if (typeof editor.Pages.getAll !== 'function') {
          console.error('[PageManager] Error: editor.Pages.getAll no es una función');
          return;
        }
        
        editor.Pages.getAll().forEach(page => {
          const pageId = page.get('id') as string;
          if (pageId !== defaultPageId) {
            editor.Pages.remove(page);
          }
        });
        
        loadedPageIds.clear();
        loadedPageIds.add(defaultPageId);
        
        // Agregar páginas recibidas
        data.pages.forEach(pageData => {
          if (!loadedPageIds.has(pageData.id)) {
            editor.Pages.add({
              id: pageData.id,
              name: pageData.name || 'Página sin nombre',
              component: pageData.components || '',
              styles: pageData.css || ''
            });
            
            loadedPageIds.add(pageData.id);
          }
        });
        
        console.log('[PageManager] Sincronización completa aplicada');
      } catch (error) {
        console.error('[PageManager] Error al aplicar sincronización completa:', error);
      } finally {
        isApplyingRemoteUpdate = false;
        isInitialLoad = false;
        savePages(); // Guardar para persistencia local
      }
    });

    // Solicitar sincronización inicial al conectar
    socket.emit('page:request-sync', { projectId });
  };

  // Función para emitir eventos de página
  const emitPageEvent = (eventType: string, data: PageEventData) => {
    if (!socketInstance || !socketInstance.connected) {
      console.warn(`[PageManager] No se puede emitir ${eventType}: Socket no conectado`);
      return;
    }
    
    if (!projectId) {
      console.warn(`[PageManager] No se puede emitir ${eventType}: projectId no disponible`);
      return;
    }
    
    // Completar datos del evento
    const completeData = {
      ...data,
      userId: getUserId(),
      projectId,
      timestamp: Date.now()
    };
    
    console.log(`[PageManager] Emitiendo evento ${eventType}:`, completeData);
    socketInstance.emit(eventType, completeData);
  };

  // Función auxiliar para serializar página para envío
  const serializePage = (page: Page): PageData => {
    return {
      id: page.get('id') as string,
      name: page.get('name') as string,
      components: page.getMainComponent()?.toJSON(),
      css: page.get('styles') as string
    };
  };

  // Función para obtener ID del usuario actual (del socket)
  const getUserId = (): string => {
    if (socketInstance) {
      return socketInstance.id || 'unknown';
    }
    return 'unknown';
  };

  // GUARDAR PÁGINAS EN EL ALMACENAMIENTO LOCAL
  const savePages = () => {
    if (isInitialLoad) {
      console.log('[PageManager] No se guardarán páginas durante carga inicial');
      return;
    }
    
    if (typeof window === 'undefined') return;

    try {
      // Verificar que editor.Pages existe y tiene el método getAll
      if (!editor.Pages || typeof editor.Pages.getAll !== 'function') {
        console.error('[PageManager] Error: editor.Pages no está definido o no tiene el método getAll');
        return;
      }

      const allPages = editor.Pages.getAll();
      const savedPages: PageData[] = [];
      
      for (const page of allPages) {
        // Seleccionar temporalmente la página para obtener sus componentes y CSS
        isSelectingPage = true;
        editor.Pages.select(page);
        isSelectingPage = false;
        
        const pageId = page.get('id') as string;
        const pageName = page.get('name') as string;
        
        if (!pageId || !pageName) {
          console.warn('[PageManager] Ignorando página sin ID o nombre', page);
          continue;
        }
        
        try {
          savedPages.push({
            id: pageId,
            name: pageName,
            html: editor.getHtml({ component: page.getMainComponent() }),
            css: editor.getCss({ component: page.getMainComponent() }),
            components: page.getMainComponent().toJSON()
          });
        } catch (error) {
          console.error(`[PageManager] Error al serializar página ${pageId}:`, error);
        }
      }
      
      // Verificar si hay páginas para guardar
      if (savedPages.length === 0) {
        console.warn('[PageManager] No hay páginas para guardar');
        return;
      }
      
      // Guardar en localStorage con nueva clave
      const storageKey = `project_${projectId}_pages`;
      
      // Guardar también la lista de páginas eliminadas
      const storageData = {
        pages: savedPages,
        deletedPages: Array.from(deletedPageIds)
      };
      
      const pagesJSON = JSON.stringify(storageData);
      
      try {
        localStorage.setItem(storageKey, pagesJSON);
        console.log(`[PageManager] Guardadas ${savedPages.length} páginas en localStorage (${deletedPageIds.size} eliminadas)`);
        
        // Eliminar clave antigua si existe
        const oldKey = `gjs-pages-${projectId}`;
        if (localStorage.getItem(oldKey)) {
          localStorage.removeItem(oldKey);
          console.log('[PageManager] Eliminada clave antigua de localStorage');
        }
      } catch (storageError) {
        // Error típico: cuota excedida
        console.error('[PageManager] Error al guardar en localStorage:', storageError);
        
        // Intentar guardar en sessionStorage como alternativa
        try {
          sessionStorage.setItem(storageKey, pagesJSON);
          console.log('[PageManager] Guardadas páginas en sessionStorage como alternativa');
        } catch (sessionError) {
          console.error('[PageManager] Error al guardar en sessionStorage:', sessionError);
          
          // Último intento: guardar versión ligera sin componentes
          try {
            const lightPages = savedPages.map(p => ({ id: p.id, name: p.name, html: p.html, css: p.css }));
            const lightData = {
              pages: lightPages,
              deletedPages: Array.from(deletedPageIds)
            };
            const lightJSON = JSON.stringify(lightData);
            sessionStorage.setItem(storageKey, lightJSON);
            console.log('[PageManager] Guardada versión ligera de páginas');
          } catch (finalError) {
            console.error('[PageManager] No se pudieron guardar las páginas:', finalError);
          }
        }
      }
    } catch (error) {
      console.error('[PageManager] Error general al guardar páginas:', error);
    }
  };

  // CARGAR PÁGINAS DESDE EL ALMACENAMIENTO LOCAL
  const loadPages = (): boolean => {
    if (typeof window === 'undefined') return false;
    
    const storageKey = `project_${projectId}_pages`;
    const oldStorageKey = `gjs-pages-${projectId}`;
    
    isInitialLoad = true;
    
    console.log('[PageManager] Intentando cargar páginas con clave:', storageKey);
    
    let storedPages: PageData[] | null = null;
    let storedDeletedPages: string[] = [];
    let source = '';
    
    // Primer intento: localStorage con nueva clave
    try {
      const pagesData = localStorage.getItem(storageKey);
      if (pagesData) {
        const parsedData = JSON.parse(pagesData);
        storedPages = parsedData.pages || parsedData; // Compatibilidad con formato antiguo
        storedDeletedPages = parsedData.deletedPages || [];
        source = 'localStorage (nueva clave)';
      }
    } catch (error) {
      console.error('[PageManager] Error al cargar páginas desde localStorage:', error);
    }
    
    // Segundo intento: localStorage con clave antigua (migración)
    if (!storedPages) {
      try {
        const oldPagesData = localStorage.getItem(oldStorageKey);
        if (oldPagesData) {
          storedPages = JSON.parse(oldPagesData);
          source = 'localStorage (clave antigua)';
          console.log('[PageManager] Cargando desde clave antigua, se migrará a nuevo formato');
        }
      } catch (error) {
        console.error('[PageManager] Error al cargar páginas desde localStorage (clave antigua):', error);
      }
    }
    
    // Tercer intento: sessionStorage con nueva clave
    if (!storedPages) {
      try {
        const sessionData = sessionStorage.getItem(storageKey);
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          storedPages = parsedData.pages || parsedData; // Compatibilidad con formato antiguo
          storedDeletedPages = parsedData.deletedPages || [];
          source = 'sessionStorage (nueva clave)';
        }
      } catch (error) {
        console.error('[PageManager] Error al cargar páginas desde sessionStorage:', error);
      }
    }
    
    // Cuarto intento: sessionStorage con clave antigua
    if (!storedPages) {
      try {
        const oldSessionData = sessionStorage.getItem(oldStorageKey);
        if (oldSessionData) {
          storedPages = JSON.parse(oldSessionData);
          source = 'sessionStorage (clave antigua)';
        }
      } catch (error) {
        console.error('[PageManager] Error al cargar páginas desde sessionStorage (clave antigua):', error);
      }
    }
    
    // Cargar lista de páginas eliminadas
    storedDeletedPages.forEach(id => {
      deletedPageIds.add(id);
    });
    
    if (storedDeletedPages.length > 0) {
      console.log(`[PageManager] Cargadas ${storedDeletedPages.length} páginas eliminadas`);
    }
    
    // Crear página por defecto si no hay ninguna guardada
    if (!storedPages || storedPages.length === 0) {
      console.log('[PageManager] No se encontraron páginas guardadas, creando página por defecto');
      createDefaultPage();
      
      // Registrar esta página como cargada
      const defaultPage = editor.Pages.getAll()[0];
      if (defaultPage) {
        const defaultId = defaultPage.get('id') as string;
        loadedPageIds.add(defaultId);
        console.log('[PageManager] Creada página por defecto con ID:', defaultId);
      }
      
      return false;
    } else {
      console.log(`[PageManager] Cargadas ${storedPages.length} páginas desde ${source}`);
      
      // Validar y procesar las páginas cargadas
      const validPages = storedPages.filter(page => {
        if (!page.id) {
          console.warn('[PageManager] Ignorando página sin ID:', page);
          return false;
        }
        
        // Verificar si la página está en la lista de eliminadas
        if (deletedPageIds.has(page.id)) {
          console.log(`[PageManager] Página ${page.id} está marcada como eliminada, ignorando`);
          return false;
        }
        
        if (!page.name) {
          console.warn('[PageManager] Página sin nombre, asignando nombre por defecto:', page.id);
          page.name = `Página ${loadedPageIds.size + 1}`;
        }
        
        // Evitar duplicados
        if (loadedPageIds.has(page.id)) {
          console.warn(`[PageManager] Ignorando página duplicada con ID: ${page.id}`);
          return false;
        }
        
        return true;
      });
      
      // Si después de la validación no quedan páginas válidas, crear una predeterminada
      if (validPages.length === 0) {
        console.log('[PageManager] No se encontraron páginas válidas, creando página predeterminada');
        createDefaultPage();
        return false;
      }
      
      // Cargar cada página válida
      for (const pageData of validPages) {
        try {
          const pageOptions: Record<string, unknown> = {
            id: pageData.id,
            name: pageData.name
          };
          
          // Añadir la página
          const page = editor.Pages.add(pageOptions);
          
          if (!page) {
            console.error(`[PageManager] No se pudo crear la página ${pageData.id}`);
            continue;
          }
          
          // Registrar esta página como cargada
          loadedPageIds.add(pageData.id);
          
          // Cargar componentes o HTML según lo disponible
          if (pageData.components) {
            try {
              const components = pageData.components;
              page.getMainComponent().append(components);
              console.log(`[PageManager] Cargados componentes para página ${pageData.id}`);
            } catch (err) {
              console.error(`[PageManager] Error al cargar componentes para página ${pageData.id}:`, err);
              
              // Fallback: intentar cargar desde HTML si los componentes fallan
              if (pageData.html) {
                editor.setComponents(pageData.html);
                console.log(`[PageManager] Usado HTML como fallback para página ${pageData.id}`);
              }
            }
          } else if (pageData.html) {
            // Si no hay componentes, cargar desde HTML directamente
            editor.setComponents(pageData.html);
            console.log(`[PageManager] Cargado HTML para página ${pageData.id}`);
          }
          
          // Cargar estilos CSS si están disponibles
          if (pageData.css) {
            editor.setStyle(pageData.css);
            console.log(`[PageManager] Cargados estilos CSS para página ${pageData.id}`);
          }
        } catch (error) {
          console.error(`[PageManager] Error al procesar página ${pageData.id}:`, error);
        }
      }
    }
    
    // Seleccionar la primera página después de cargar
    const pages = editor.Pages.getAll();
    if (pages.length > 0) {
      isSelectingPage = true;
      editor.Pages.select(pages[0]);
      isSelectingPage = false;
      console.log('[PageManager] Seleccionada primera página después de cargar');
    }
    
    // Guardar inmediatamente con el nuevo formato para asegurar consistencia
    setTimeout(() => {
      isInitialLoad = false;
      savePages();
      console.log('[PageManager] Finalizada carga inicial de páginas, guardando con nuevo formato');
    }, 500);
    
    return true;
  };
  
  // Crear una página predeterminada si no hay ninguna
  const createDefaultPage = () => {
    console.log('[PageManager] Creando página predeterminada');
    const defaultPage = editor.Pages.add({
      id: generateUniqueId(),
      name: 'Página 1'
    });
    return defaultPage;
  };

  // Inicialización: asegurar sincronización entre local storage y socket
  const initStorage = () => {
    // Migrar datos de la clave antigua si existen
    if (typeof window !== 'undefined' && projectId) {
      const oldKey = `gjs-pages-${projectId}`;
      const newKey = `project_${projectId}_pages`;
      
      // Comprobar si hay datos en la clave antigua
      const oldData = localStorage.getItem(oldKey);
      if (oldData && !localStorage.getItem(newKey)) {
        console.log('[PageManager] Migrando datos del formato antiguo al nuevo');
        localStorage.setItem(newKey, oldData);
        // No eliminamos la clave antigua todavía por compatibilidad
      }
    }
    
    // Cargar páginas guardadas
    const loaded = loadPages();
    console.log('[PageManager] Estado de carga de páginas:', loaded ? 'Éxito' : 'No se encontraron páginas guardadas');

    // Configurar eventos de socket después de cargar las páginas
    if (socketInstance) {
      setupSocketListeners(socketInstance);
    }
  };

  // Agregar CSS para el modal
  const cssString = `
    .gjs-pages-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 100;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .gjs-pages-modal-content {
      background: black;
      border-radius: 5px;
      min-width: 500px;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
      padding: 20px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .gjs-pages-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }
    .gjs-pages-title {
      font-size: 18px;
      font-weight: bold;
    }
    .gjs-pages-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
    }
    .gjs-pages-list {
      margin-bottom: 20px;
    }
    .gjs-page-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      margin-bottom: 5px;
      border: 1px solid #ddd;
      border-radius: 3px;
    }
    .gjs-page-item.active {
      background-color: rgb(0, 0, 0);
      border-color: #aaa;
    }
    .gjs-page-name {
      flex-grow: 1;
      margin-right: 10px;
    }
    .gjs-page-actions {
      display: flex;
      gap: 5px;
    }
    .gjs-add-page-form {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }
    .gjs-add-page-input {
      flex-grow: 1;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 3px;
    }
    .gjs-btn {
      padding: 5px 10px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    .gjs-btn-primary {
      background-color: #4285f4;
      color: white;
    }
    .gjs-btn-secondary {
      background-color: rgb(255, 255, 255);
      color: #202124;
    }
    .gjs-btn-danger {
      background-color: #ea4335;
      color: white;
    }
    .gjs-edit-page-input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 3px;
      margin-bottom: 10px;
    }
  `;

  // Agregar estilos al editor
  const style = document.createElement('style');
  style.innerHTML = cssString;
  document.head.appendChild(style);

  // Añadir comando para abrir el modal de páginas
  editor.Commands.add('open-pages', {
    run: () => {
      // Verificar si ya existe un modal abierto
      if (document.querySelector(`.gjs-pages-modal`)) return;
      
      // Crear elementos del modal
      const modal = document.createElement('div');
      modal.className = `gjs-pages-modal`;
      
      const modalContent = document.createElement('div');
      modalContent.className = `gjs-pages-modal-content`;
      
      // Cabecera del modal
      const header = document.createElement('div');
      header.className = `gjs-pages-header`;
      
      const title = document.createElement('div');
      title.className = `gjs-pages-title`;
      title.textContent = 'Administrar Páginas';
      
      const closeBtn = document.createElement('button');
      closeBtn.className = `gjs-pages-close`;
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', () => {
        modal.remove();
      });
      
      header.appendChild(title);
      header.appendChild(closeBtn);
      
      // Opción de sincronización de selección
      const syncOption = document.createElement('div');
      syncOption.style.marginBottom = '15px';
      syncOption.style.display = 'flex';
      syncOption.style.alignItems = 'center';
      
      const syncCheckbox = document.createElement('input');
      syncCheckbox.type = 'checkbox';
      syncCheckbox.id = 'sync-page-selection';
      syncCheckbox.checked = window.syncPageSelection || false;
      syncCheckbox.addEventListener('change', () => {
        window.syncPageSelection = syncCheckbox.checked;
        console.log(`[PageManager] Sincronización de selección ${window.syncPageSelection ? 'activada' : 'desactivada'}`);
      });
      
      const syncLabel = document.createElement('label');
      syncLabel.htmlFor = 'sync-page-selection';
      syncLabel.textContent = 'Sincronizar selección de páginas entre usuarios';
      syncLabel.style.marginLeft = '8px';
      syncLabel.style.cursor = 'pointer';
      
      syncOption.appendChild(syncCheckbox);
      syncOption.appendChild(syncLabel);
      
      // Lista de páginas
      const pagesList = document.createElement('div');
      pagesList.className = `gjs-pages-list`;
      
      // Función para renderizar la lista de páginas
      const renderPagesList = () => {
        pagesList.innerHTML = '';
        
        editor.Pages.getAll().forEach(page => {
          const pageId = page.get('id') || '';
          const pageName = page.get('name') || 'Sin nombre';
          const isActive = editor.Pages.getSelected()?.get('id') === pageId;
          
          const pageItem = document.createElement('div');
          pageItem.className = `gjs-page-item ${isActive ? 'active' : ''}`;
          
          // ID de la página (para depuración)
          const pageIdEl = document.createElement('div');
          pageIdEl.className = `gjs-page-id`;
          pageIdEl.textContent = `ID: ${pageId}`;
          pageIdEl.style.fontSize = '10px';
          pageIdEl.style.color = '#999';
          pageIdEl.style.marginBottom = '3px';
          
          // Nombre de la página (muestra texto o input de edición)
          const pageNameEl = document.createElement('div');
          pageNameEl.className = `gjs-page-name`;
          pageNameEl.textContent = pageName;
          
          // Acciones para la página
          const pageActions = document.createElement('div');
          pageActions.className = `gjs-page-actions`;
          
          // Botón para establecer como página actual
          if (!isActive) {
            const selectBtn = document.createElement('button');
            selectBtn.className = `gjs-btn gjs-btn-secondary`;
            selectBtn.textContent = 'Seleccionar';
            selectBtn.addEventListener('click', () => {
              if (pageId) {
                isSelectingPage = true;
                editor.Pages.select(pageId);
                isSelectingPage = false;
                renderPagesList();
              }
            });
            pageActions.appendChild(selectBtn);
          }
          
          // Botón para editar la página
          const editBtn = document.createElement('button');
          editBtn.className = `gjs-btn gjs-btn-secondary`;
          editBtn.textContent = 'Editar';
          editBtn.addEventListener('click', () => {
            const currentName = pageNameEl.textContent || '';
            pageNameEl.innerHTML = '';
            
            const editInput = document.createElement('input');
            editInput.className = `gjs-edit-page-input`;
            editInput.value = currentName;
            editInput.addEventListener('keydown', (e) => {
              if (e.key === 'Enter') {
                const newName = editInput.value.trim();
                if (newName) {
                  page.set('name', newName);
                  renderPagesList();
                }
              } else if (e.key === 'Escape') {
                renderPagesList();
              }
            });
            
            pageNameEl.appendChild(editInput);
            editInput.focus();
            editInput.select();
          });
          
          // Botón para eliminar la página
          const deleteBtn = document.createElement('button');
          deleteBtn.className = `gjs-btn gjs-btn-danger`;
          deleteBtn.textContent = 'Eliminar';
          deleteBtn.addEventListener('click', () => {
            if (editor.Pages.getAll().length <= 1) {
              alert('No puedes eliminar la única página del proyecto.');
              return;
            }
            
            if (confirm(`¿Estás seguro de eliminar la página "${pageName}"?`)) {
              editor.Pages.remove(page);
              renderPagesList();
            }
          });
          
          // Añadir botones a las acciones
          pageActions.appendChild(editBtn);
          pageActions.appendChild(deleteBtn);
          
          // Estructurar el elemento de página
          const pageDetails = document.createElement('div');
          pageDetails.style.display = 'flex';
          pageDetails.style.flexDirection = 'column';
          pageDetails.style.flex = '1';
          
          pageDetails.appendChild(pageIdEl);
          pageDetails.appendChild(pageNameEl);
          
          pageItem.appendChild(pageDetails);
          pageItem.appendChild(pageActions);
          pagesList.appendChild(pageItem);
        });
      };
      
      // Renderizar la lista inicial
      renderPagesList();
      
      // Formulario para añadir nueva página
      const addPageForm = document.createElement('div');
      addPageForm.className = `gjs-add-page-form`;
      
      const pageNameInput = document.createElement('input');
      pageNameInput.className = `gjs-add-page-input`;
      pageNameInput.placeholder = 'Nombre de la nueva página';
      
      const addBtn = document.createElement('button');
      addBtn.className = `gjs-btn gjs-btn-primary`;
      addBtn.textContent = 'Añadir página';
      
      // Función para añadir nueva página
      const addPage = () => {
        const pageName = pageNameInput.value.trim();
        if (pageName) {
          // Generar un ID único para la página
          const pageId = `page-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          
          isSelectingPage = true;
          const newPage = editor.Pages.add({ id: pageId, name: pageName });
          if (newPage) {
            editor.Pages.select(newPage);
          }
          isSelectingPage = false;
          
          pageNameInput.value = '';
          renderPagesList();
        }
      };
      
      // Manejar click en botón y tecla Enter
      addBtn.addEventListener('click', addPage);
      pageNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addPage();
      });
      
      addPageForm.appendChild(pageNameInput);
      addPageForm.appendChild(addBtn);
      
      // Construir el modal
      modalContent.appendChild(header);
      modalContent.appendChild(syncOption); // Añadir opción de sincronización
      modalContent.appendChild(pagesList);
      modalContent.appendChild(addPageForm);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
      
      // Enfocar el input para nueva página
      pageNameInput.focus();
    }
  });
  
  // Añadir botón de depuración para ver páginas eliminadas
  if (process.env.NODE_ENV !== 'production') {
    editor.Commands.add('debug-deleted-pages', {
      run: () => {
        if (typeof window !== 'undefined') {
          const deletedList = Array.from(deletedPageIds);
          console.log('Páginas eliminadas:', deletedList);
          alert(`Páginas eliminadas (${deletedList.length}):\n\n${deletedList.join('\n')}`);
        }
      }
    });
  }
  
  // Botón de depuración para ver páginas guardadas
  if (process.env.NODE_ENV !== 'production') {
    editor.Commands.add('debug-pages', {
      run: () => {
        if (typeof window !== 'undefined') {
          const projectId = window.currentProjectId || 'default-project';
          const storageKey = `project_${projectId}_pages`;
          
          const pagesJson = localStorage.getItem(storageKey);
          if (pagesJson) {
            try {
              const pages: PageData[] = JSON.parse(pagesJson);
              // Mostrar tamaño en KB
              const sizeKB = Math.round(pagesJson.length / 1024);
              console.log(`Páginas guardadas en localStorage (${sizeKB}KB):`, pages);
              alert(`Páginas guardadas: ${pages.length} (${sizeKB}KB)\n\n${pages.map(p => `${p.id}: ${p.name}`).join('\n')}`);
            } catch (e: unknown) {
              const error = e as Error;
              console.error('Error al parsear páginas:', error);
              alert('Error al parsear páginas: ' + error.message);
            }
          } else {
            alert('No hay páginas guardadas en localStorage');
          }
        }
      }
    });
  }
  
  // Añadir botón de depuración para limpiar páginas corruptas
  if (process.env.NODE_ENV !== 'production') {
    editor.Commands.add('clear-pages-cache', {
      run: () => {
        if (typeof window !== 'undefined' && confirm('¿Estás seguro de limpiar la caché de páginas? Esto eliminará todas las páginas guardadas.')) {
          const projectId = window.currentProjectId || 'default-project';
          const storageKey = `project_${projectId}_pages`;
          
          localStorage.removeItem(storageKey);
          sessionStorage.removeItem(storageKey);
          alert('Caché de páginas limpiada. Recarga la página para crear una página nueva por defecto.');
        }
      }
    });
  }

  // Botón para forzar guardado optimizado (útil para depuración)
  if (process.env.NODE_ENV !== 'production') {
    editor.Commands.add('force-save-pages', {
      run: () => {
        if (typeof window !== 'undefined') {
          console.log('Forzando guardado optimizado de páginas...');
          isInitialLoad = false; // Asegurar que no estamos en modo carga
          savePages();
          alert('Se ha forzado el guardado optimizado de páginas.');
        }
      }
    });
  }
  
  // Inicializar eventos para sincronización en tiempo real
  setupPageSyncEvents();
  
  // Configurar escucha de socket si está disponible
  if (socketInstance) {
    setupSocketListeners(socketInstance);
  }
  
  // Cargar páginas inmediatamente
  console.log('Intentando cargar páginas...');
  loadPages();
  
  // También guardar las páginas al destruir el editor para evitar pérdida de datos
  editor.on('destroy', () => {
    console.log('Editor destruido. Guardando páginas...');
    isInitialLoad = false;
    savePages();
  });

  // Guardar páginas automáticamente cada minuto
  const autoSaveInterval = setInterval(() => {
    if (editor && editor.Pages) {
      console.log('Guardado automático de páginas...');
      savePages();
    } else {
      clearInterval(autoSaveInterval);
    }
  }, 60000);

  // Al cargar el plugin, inicializar el sistema de páginas
  editor.on('load', () => {
    // Configurar eventos básicos
    setupPageSyncEvents();
    
    // Inicializar almacenamiento y socket
    setTimeout(() => {
      initStorage();
    }, 100);
  });

  console.log('Plugin de administrador de páginas cargado correctamente');
};

export default pageManagerPlugin; 