interface Window {
  grapesJsActions?: {
    getContent: () => Record<string, unknown>;
    getHtml: () => string;
    getCss: () => string;
    getJs: () => string;
    getAllPages?: () => Array<{id: string, name: string, html?: string, css?: string}>;
    showStyles?: () => void;
    showLayers?: () => void;
    showTraits?: () => void;
    toggleComponentOutline?: () => void;
    togglePreview?: () => void;
    openPagesDialog?: () => void;
    exportHTML?: () => void;
    setDeviceDesktop?: () => void;
    setDeviceTablet?: () => void;
    setDeviceMobile?: () => void;
  };
  currentProjectId?: string;
  socketInstance?: unknown;
  userId?: string;
} 