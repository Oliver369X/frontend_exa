import { Editor } from 'grapesjs';
import { GrapesJSActions } from '../types';
import JSZip from 'jszip';

// Agregar JSZip al objeto window para que esté disponible en el cliente
declare global {
  interface Window {
    JSZip: typeof JSZip;
  }
}

/**
 * Configura las acciones disponibles para el editor GrapesJS.
 * @param editor Instancia del editor
 * @param createShowPanelFn Función para crear handler para mostrar paneles
 * @returns Objeto con acciones disponibles
 */
export function setupEditorActions(editor: Editor, createShowPanelFn: (panelId: string) => () => void): GrapesJSActions {
  const actions: GrapesJSActions = {
    // Funciones básicas para obtener datos
    getContent: () => {
      return {
        components: editor.getComponents(),
        styles: editor.getCss()
      };
    },
    getHtml: () => editor.getHtml(),
    getCss: () => editor.getCss(),
    getJs: () => editor.getJs ? editor.getJs() : '',
    
    // Opcional: Obtener todas las páginas si están disponibles
    getAllPages: () => {
      if (editor.Pages) {
        return editor.Pages.getAll().map(page => ({
          id: page.get('id') as string,
          name: page.get('name') as string,
          html: page.getMainComponent() ? editor.getHtml({ component: page.getMainComponent() }) : '',
          css: page.getMainComponent() ? editor.getCss({ component: page.getMainComponent() }) : ''
        }));
      }
      return [];
    },

    // Funciones para manipular los paneles
    showStyles: createShowPanelFn('style'),
    showLayers: createShowPanelFn('layers'),
    showTraits: createShowPanelFn('traits'),
    
    // Funciones para manipular la vista
    toggleComponentOutline: () => {
      // Accedemos al canvas y alternamos la visualización de los contornos
      try {
        const canvas = editor.Canvas;
        // @ts-ignore - Estas propiedades existen en GrapesJS pero no están bien tipadas
        const currentState = canvas.getConfig().showOffsets || false;
        // @ts-ignore - El método existe pero no está correctamente tipado
        canvas.setConfig({ showOffsets: !currentState });
        canvas.refresh();
      } catch (e) {
        console.error('Error al alternar contornos de componentes:', e);
      }
    },
    
    togglePreview: () => {
      editor.Commands.isActive('preview') ? editor.Commands.stop('preview') : editor.Commands.run('preview');
    },

    // Funciones para manipular dispositivos
    setDeviceDesktop: () => {
      editor.setDevice('Desktop');
      // Actualizar UI
      document.querySelectorAll('#device-desktop, #device-tablet, #device-mobile').forEach(el => {
        el.classList.remove('active');
      });
      document.getElementById('device-desktop')?.classList.add('active');
    },
    
    setDeviceTablet: () => {
      editor.setDevice('Tablet');
      // Actualizar UI
      document.querySelectorAll('#device-desktop, #device-tablet, #device-mobile').forEach(el => {
        el.classList.remove('active');
      });
      document.getElementById('device-tablet')?.classList.add('active');
    },
    
    setDeviceMobile: () => {
      editor.setDevice('Mobile');
      // Actualizar UI
      document.querySelectorAll('#device-desktop, #device-tablet, #device-mobile').forEach(el => {
        el.classList.remove('active');
      });
      document.getElementById('device-mobile')?.classList.add('active');
    },
    
    // Función para manipular páginas
    openPagesDialog: () => {
      if (editor.Commands.has('open-pages')) {
        editor.Commands.run('open-pages');
      } else {
        console.error('Comando open-pages no encontrado');
        alert('La administración de páginas no está disponible en esta versión');
      }
    },
    
    // Funciones de exportación
    exportHTML: () => {
          const html = editor.getHtml();
          const css = editor.getCss();
          
      // Crear una estructura de página HTML completa
      const fullHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Página Exportada</title>
  <style>
${css}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
        
      // Crear un blob con el HTML completo
      const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Crear un enlace para descargar el archivo
        const a = document.createElement('a');
        a.href = url;
      a.download = `pagina-exportada-${new Date().getTime()}.html`;
        a.click();
        
      // Liberar la URL
          URL.revokeObjectURL(url);
    }
  };
  
  return actions;
}

// Exportamos la interfaz para que sea accesible
export type { GrapesJSActions }; 