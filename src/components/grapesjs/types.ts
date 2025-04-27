import type { Editor } from "grapesjs";

// Extender el objeto Window para incluir nuestras propiedades personalizadas
declare global {
  interface Window {
    // ID del proyecto actual para el editor
    currentProjectId?: string;
    // Proveedor de socket para comunicación en tiempo real
    socketProvider?: {
      socket: any; // Idealmente definiríamos un tipo más específico
      userId?: string;
    };
  }
}

// Tipos utilizados en el editor
export interface GrapesJSData {
  components?: Record<string, any>[];
  styles?: string;
  pages?: PageData[];
}

export interface PageData {
  id: string;
  name: string;
  components?: Record<string, any>[];
  html?: string;
  css?: string;
}

export interface EditorDeltaUpdate {
  type: 'component:add' | 'component:remove' | 'component:update' | 'style:update' | 'pages:update';
  data: any;
  componentId?: string;
  parentId?: string;
  index?: number;
  pageId?: string;
}

export interface SimpleGrapesEditorHandle {
  getEditorInstance: () => Editor | null;
}

// Interfaz para acciones del editor
export interface GrapesJSActions {
  showLayers: () => void;
  showStyles: () => void;
  showTraits: () => void;
  setDeviceDesktop: () => void;
  setDeviceTablet: () => void;
  setDeviceMobile: () => void;
  toggleComponentOutline: () => void;
  togglePreview: () => void;
  openPagesDialog: () => void;
  exportHTML: () => void;
} 