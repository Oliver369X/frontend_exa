// Extender el objeto Window para incluir nuestras propiedades personalizadas
declare global {
  interface Window {
    // ID del proyecto actual para el editor
    currentProjectId?: string;
    // Proveedor de socket para comunicación en tiempo real
    socketProvider?: {
      socket: unknown; // Idealmente definiríamos un tipo más específico
      userId?: string;
    };
  }
}

// Tipos utilizados en el editor
export interface GrapesJSData {
  components?: unknown[] | string;
  styles?: string;
  html?: string;
  css?: string;
  js?: string;
  pages?: Array<{
    id: string;
    name: string;
    html?: string;
    css?: string;
  }>;
}

export interface PageData {
  id: string;
  name: string;
  components?: Record<string, unknown>[];
  html?: string;
  css?: string;
}

// Definir tipos para actualizaciones del editor
export type EditorUpdateType = 
  | 'component:add' 
  | 'component:remove' 
  | 'component:update' 
  | 'component:move'
  | 'style:update'
  | 'style:add'
  | 'style:remove'
  | 'pages:update';

export interface EditorDeltaUpdate {
  type: EditorUpdateType;
  data: Record<string, unknown>;
  componentId?: string;
  parentId?: string;
  index?: number;
}

// Definir tipo para la referencia al editor
export interface SimpleGrapesEditorHandle {
  getEditorInstance: () => unknown;
}

// Definir acciones que exponemos a través de window
export interface GrapesJSActions {
  // Funciones básicas para obtener datos
  getContent: () => Record<string, unknown>;
  getHtml: () => string;
  getCss: () => string; 
  getJs: () => string;
  getAllPages?: () => Array<{
    id: string;
    name: string;
    html?: string;
    css?: string;
  }>;
  
  // Funciones para manipular el panel
  showStyles?: () => void;
  showLayers?: () => void;
  showTraits?: () => void;
  
  // Funciones para manipular la vista
  toggleComponentOutline?: () => void;
  togglePreview?: () => void;
  
  // Funciones para manipular dispositivos
  setDeviceDesktop?: () => void;
  setDeviceTablet?: () => void;
  setDeviceMobile?: () => void;
  
  // Funciones para manipular páginas
  openPagesDialog?: () => void;
  
  // Funciones de exportación
  exportHTML?: () => void;
} 