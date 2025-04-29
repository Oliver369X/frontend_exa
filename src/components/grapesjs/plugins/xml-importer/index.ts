import { Plugin } from 'grapesjs';
import type { PluginOptions } from 'grapesjs';
import { Parser } from 'xml2js';
import { createRoot } from 'react-dom/client';
import ImportXmlModal from '../../modals/ImportXmlModal';

export interface XmlImporterPluginOptions {
  /**
   * Panel donde se mostrará el botón de importación
   */
  panelId?: string;
  /**
   * Texto del botón de importación
   */
  buttonLabel?: string;
  /**
   * Título de la ventana modal
   */
  modalTitle?: string;
  /**
   * ID del comando para abrir la modal
   */
  commandId?: string;
  /**
   * Opciones de conversión XML
   */
  xmlOptions?: {
    /**
     * Preservar espacios en blanco
     */
    preserveWhitespace?: boolean;
    /**
     * Convertir claves a camelCase
     */
    normalizeTags?: boolean;
    /**
     * Convertir valores numéricos a números
     */
    explicitArray?: boolean;
  };
}

const defaultOptions: XmlImporterPluginOptions = {
  panelId: 'views',
  buttonLabel: 'Importar XML',
  modalTitle: 'Importar desde XML',
  commandId: 'import-xml',
  xmlOptions: {
    preserveWhitespace: true,
    normalizeTags: false,
    explicitArray: false
  }
};

// Mapeo de etiquetas XML a componentes GrapesJS
const tagMapping: Record<string, string> = {
  div: 'div',
  span: 'text',
  button: 'button',
  img: 'image',
  a: 'link',
  form: 'form',
  input: 'input',
  textarea: 'textarea',
  select: 'select',
  option: 'option',
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  h5: 'heading',
  h6: 'heading',
  p: 'paragraph',
  ul: 'list',
  ol: 'list',
  li: 'list-item',
  table: 'table',
  tr: 'table-row',
  td: 'table-cell',
  th: 'table-cell',
  section: 'section',
  article: 'section',
  header: 'section',
  footer: 'section',
  nav: 'section',
  aside: 'section',
  main: 'section',
  video: 'video',
  audio: 'audio',
  iframe: 'iframe',
  canvas: 'div',
  svg: 'svg',
  path: 'svg-path',
  rect: 'svg-rect',
  circle: 'svg-circle',
  // Agregar más mapeos según sea necesario
};

/**
 * Plugin para importar XML a componentes de GrapesJS
 * @param editor Instancia del editor GrapesJS
 * @param opts Opciones del plugin
 */
const xmlImporterPlugin: Plugin<XmlImporterPluginOptions> = (editor, opts = {}) => {
  const options = { ...defaultOptions, ...opts };
  const { panelId, buttonLabel, modalTitle, commandId, xmlOptions } = options;

  // Agregar comando para abrir la modal
  editor.Commands.add(commandId!, {
    run: () => showImportModal(),
    stop: () => hideImportModal()
  });

  // Crear botón en el panel
  if (panelId) {
    editor.Panels.addButton(panelId, {
      id: 'import-xml',
      className: 'fa fa-file-code',
      command: commandId,
      attributes: { title: buttonLabel }
    });
  }

  // Función para mostrar la modal
  const showImportModal = () => {
    const modalContainer = document.createElement('div');
    modalContainer.id = 'xml-import-modal-container';
    document.body.appendChild(modalContainer);

    const root = createRoot(modalContainer);
    
    const handleClose = () => {
      root.render(
        <ImportXmlModal
          show={false}
          onHide={() => {
            // Eliminar el contenedor después de la animación de cierre
            setTimeout(() => {
              if (modalContainer.parentNode) {
                document.body.removeChild(modalContainer);
                root.unmount();
              }
            }, 300);
            editor.Commands.stop(commandId!);
          }}
          onImport={() => {}}
          editorInstance={editor}
        />
      );
    };
    
    const handleImport = (components: any[]) => {
      if (!components || components.length === 0) return;
      
      try {
        // Obtener el componente seleccionado o el componente wrapper
        const target = editor.getSelected() || editor.getWrapper();
        
        // Añadir componentes al editor
        components.forEach(component => {
          editor.DomComponents.addComponent(component, { at: target });
        });
        
        // Notificar éxito
        editor.Toast.add({
          content: 'Componentes XML importados correctamente',
          type: 'success',
        });
        
        hideImportModal();
      } catch (error) {
        console.error('Error al importar componentes XML:', error);
        editor.Toast.add({
          content: 'Error al importar los componentes XML',
          type: 'error',
        });
      }
    };
    
    // Renderizar modal
    root.render(
      <ImportXmlModal
        show={true}
        onHide={handleClose}
        onImport={handleImport}
        editorInstance={editor}
      />
    );
  };

  // Función para ocultar y eliminar la modal
  const hideImportModal = () => {
    const modalContainer = document.getElementById('xml-import-modal-container');
    if (modalContainer && modalContainer.parentNode) {
      document.body.removeChild(modalContainer);
    }
  };

  /**
   * Importa el contenido XML al editor usando los métodos nativos
   * @param xmlContent Contenido XML
   * @param options Opciones de importación
   */
  const importXmlToEditor = async (xmlContent: string, options: { convertTags: boolean }) => {
    try {
      const parser = new Parser({
        explicitArray: xmlOptions?.explicitArray,
        normalize: xmlOptions?.normalizeTags,
        preserveWhitespace: xmlOptions?.preserveWhitespace
      });

      // Parsear XML
      const result = await new Promise<any>((resolve, reject) => {
        parser.parseString(xmlContent, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      // Limpiar espacio de trabajo
      editor.Commands.run('core:canvas-clear');

      // Convertir XML a componentes
      const rootTag = Object.keys(result)[0];
      const rootEl = result[rootTag];
      
      const rootComponent = createComponentFromXml(rootTag, rootEl, options.convertTags);
      
      // Agregar componente al canvas
      editor.DomComponents.addComponent(rootComponent);
      
      editor.Notifications.add({
        type: 'success',
        title: 'XML Importado',
        content: 'El XML se ha importado correctamente',
        timeout: 3000
      });
    } catch (error) {
      console.error('Error importando XML:', error);
      editor.Notifications.add({
        type: 'error',
        title: 'Error',
        content: `Error al importar XML: ${(error as Error).message}`,
        timeout: 5000
      });
    }
  };

  /**
   * Crea un componente GrapesJS a partir de datos XML
   */
  const createComponentFromXml = (tagName: string, xmlData: any, convertTags: boolean): any => {
    // Determinar el tipo de componente
    const type = convertTags ? getComponentType(tagName) : 'div';
    
    // Extraer atributos y contenido
    const attributes: Record<string, any> = {};
    const content: any[] = [];
    
    // Procesar atributos
    Object.entries(xmlData).forEach(([key, value]) => {
      if (key === '$') {
        // Los atributos están bajo la clave $
        Object.entries(value as object).forEach(([attrKey, attrValue]) => {
          attributes[attrKey] = attrValue;
        });
      } else if (key !== '_') {
        // Elementos hijos
        if (Array.isArray(value)) {
          value.forEach((childData) => {
            content.push(createComponentFromXml(key, childData, convertTags));
          });
        } else {
          content.push(createComponentFromXml(key, value, convertTags));
        }
      }
    });
    
    // Manejar contenido de texto
    if (xmlData._ && typeof xmlData._ === 'string') {
      content.push({ type: 'text', content: xmlData._ });
    }
    
    // Crear el componente
    const component: any = {
      type,
      attributes,
    };
    
    // Agregar contenido si existe
    if (content.length > 0) {
      component.components = content;
    }
    
    // Agregar clases y estilos específicos según atributos
    processSpecialAttributes(component, attributes);
    
    return component;
  };
  
  /**
   * Determina el tipo de componente GrapesJS basado en la etiqueta XML
   */
  const getComponentType = (tagName: string): string => {
    return tagMapping[tagName.toLowerCase()] || 'div';
  };
  
  /**
   * Procesa atributos especiales como class y style
   */
  const processSpecialAttributes = (component: any, attributes: Record<string, any>) => {
    // Procesar clases
    if (attributes.class) {
      component.classes = attributes.class.split(' ');
      delete attributes.class;
    }
    
    // Procesar estilos inline
    if (attributes.style) {
      component.style = parseInlineStyles(attributes.style);
      delete attributes.style;
    }
    
    // Manejar atributos específicos según el tipo de componente
    switch (component.type) {
      case 'image':
        if (attributes.src) {
          component.src = attributes.src;
          delete attributes.src;
        }
        break;
      case 'link':
        if (attributes.href) {
          component.href = attributes.href;
          delete attributes.href;
        }
        break;
      case 'video':
        if (attributes.src) {
          component.provider = 'so'; // source
          component.src = attributes.src;
          delete attributes.src;
        }
        break;
      case 'heading':
        // Determinar el nivel del encabezado
        const level = parseInt(component.tagName.substring(1));
        component.attributes.level = level;
        break;
    }
  };
  
  /**
   * Convierte estilos inline a objeto de estilos
   */
  const parseInlineStyles = (styleString: string): Record<string, string> => {
    const styles: Record<string, string> = {};
    
    styleString.split(';').forEach(style => {
      const [property, value] = style.split(':').map(s => s.trim());
      if (property && value) {
        // Convertir propiedades con guion a camelCase
        const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        styles[camelProperty] = value;
      }
    });
    
    return styles;
  };
};

export default xmlImporterPlugin; 