import type { Editor } from "grapesjs";
import type { GrapesJSActions } from "../types";
import JSZip from 'jszip';

// Agregar JSZip al objeto window para que esté disponible en el cliente
declare global {
  interface Window {
    JSZip: typeof JSZip;
  }
}

/**
 * Configura las acciones del editor GrapesJS y las retorna como un objeto
 */
export const setupEditorActions = (
  editor: Editor,
  createShowPanelFn: (panelId: string) => () => void
): GrapesJSActions => {
  // Asignar JSZip a window para que esté disponible
  if (typeof window !== 'undefined') {
    window.JSZip = JSZip;
  }

  // Crear las acciones del editor
  const actions: GrapesJSActions = {
    // Funciones para mostrar diferentes paneles
    showLayers: createShowPanelFn('layers'),
    showStyles: createShowPanelFn('style'),
    showTraits: createShowPanelFn('traits'),
    
    // Funciones para cambiar el dispositivo
    setDeviceDesktop: () => {
      editor.setDevice('Desktop');
    },
    setDeviceTablet: () => {
      editor.setDevice('Tablet');
    },
    setDeviceMobile: () => {
      editor.setDevice('Mobile');
    },
    
    // Función para alternar la visibilidad de los contornos de componentes
    toggleComponentOutline: () => {
      const canvas = editor.Canvas;
      canvas.setConfig('showOffsets', !canvas.getConfig().showOffsets);
      canvas.repaint();
    },
    
    // Función para alternar el modo de vista previa
    togglePreview: () => {
      editor.Commands.isActive('core:preview')
        ? editor.Commands.stop('core:preview')
        : editor.Commands.run('core:preview');
    },
    
    // Función para abrir el panel de páginas
    openPagesDialog: () => {
      // Si el editor tiene el administrador de páginas, abre el modal
      if (editor.Pages) {
        editor.runCommand('open-pages');
      }
    },
    
    // Función para exportar HTML
    exportHTML: () => {
      // Verificar si tiene múltiples páginas
      if (editor.Pages && editor.Pages.getAll().length > 1) {
        // Obtener todas las páginas
        const pages = editor.Pages.getAll();
        const pagesData = [];
        
        // Obtener CSS global que aplica a todas las páginas
        const globalCss = editor.getCss();
        
        // Guardar página actual para restaurarla después
        const currentPage = editor.Pages.getSelected();
        
        // Procesar cada página
        pages.forEach(page => {
          // Seleccionar la página para obtener su contenido
          editor.Pages.select(page);
          
          const pageHtml = editor.getHtml();
          const pageCss = editor.getCss({ avoidProtected: true });
          
          pagesData.push({
            id: page.get('id'),
            name: page.get('name'),
            html: pageHtml,
            css: pageCss
          });
        });
        
        // Restaurar página original
        editor.Pages.select(currentPage);
        
        // Crear un archivo HTML para cada página
        const jsZip = window.JSZip || null;
        
        if (jsZip) {
          // Usar JSZip si está disponible
          const zip = new jsZip();
          
          // Añadir archivo de índice
          let indexHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proyecto Exportado</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    ul { padding: 0; }
    li { margin-bottom: 10px; list-style: none; }
    a { display: block; padding: 10px; background-color: #f5f5f5; color: #333; 
        text-decoration: none; border-radius: 5px; }
    a:hover { background-color: #e0e0e0; }
  </style>
</head>
<body>
  <h1>Páginas del Proyecto</h1>
  <ul>`;
          
          // Añadir enlaces a cada página
          pagesData.forEach(page => {
            const safeFileName = page.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            indexHtml += `\n    <li><a href="${safeFileName}.html">${page.name}</a></li>`;
          });
          
          indexHtml += `
  </ul>
</body>
</html>`;
          
          zip.file('index.html', indexHtml);
          
          // Añadir archivos CSS comunes
          zip.file('styles.css', globalCss);
          
          // Añadir cada página como un archivo HTML separado
          pagesData.forEach(page => {
            const safeFileName = page.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
            const pageHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.name}</title>
  <link rel="stylesheet" href="styles.css">
  <style>${page.css}</style>
</head>
<body>
  ${page.html}
  <div style="margin-top: 30px; text-align: center;">
    <a href="index.html" style="display: inline-block; padding: 10px 15px; background-color: #f5f5f5; color: #333; text-decoration: none; border-radius: 5px;">Volver al Índice</a>
  </div>
</body>
</html>`;
            
            zip.file(`${safeFileName}.html`, pageHtml);
          });
          
          // Generar y descargar el ZIP
          zip.generateAsync({ type: 'blob' }).then(content => {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'proyecto-exportado.zip';
            document.body.appendChild(a);
            a.click();
            
            // Limpiar
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }, 100);
          });
        } else {
          // Si JSZip no está disponible, exportar solo la página actual
          const html = editor.getHtml();
          const css = editor.getCss();
          
          // Mostrar un mensaje al usuario
          alert('Para exportar múltiples páginas se requiere la librería JSZip. Se exportará solo la página actual.');
          
          // Combinar HTML y CSS en un string
          const completeHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentPage.get('name')}</title>
  <style>${css}</style>
</head>
<body>
  ${html}
</body>
</html>`;
          
          // Crear un objeto Blob con el HTML
          const blob = new Blob([completeHTML], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          
          // Crear un enlace para descargar el archivo
          const a = document.createElement('a');
          a.href = url;
          a.download = 'pagina-exportada.html';
          document.body.appendChild(a);
          a.click();
          
          // Limpiar
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 100);
        }
      } else {
        // Exportar una sola página (comportamiento actual)
        const html = editor.getHtml();
        const css = editor.getCss();
        
        // Combinar HTML y CSS en un string
        const completeHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Página Exportada</title>
  <style>${css}</style>
</head>
<body>
  ${html}
</body>
</html>`;
        
        // Crear un objeto Blob con el HTML
        const blob = new Blob([completeHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Crear un enlace para descargar el archivo
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pagina-exportada.html';
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 100);
      }
    }
  };
  
  return actions;
};

// Exportamos la interfaz para que sea accesible
export type { GrapesJSActions }; 