/**
 * Servicio para parsear XML a componentes de GrapesJS
 * Esta clase proporciona métodos para convertir código XML a componentes utilizables en GrapesJS
 */

import { parseString } from 'xml2js';

export interface XmlParseResult {
  rootName: string;
  parsedData: any;
  error?: string;
}

export interface ComponentConversionResult {
  success: boolean;
  components: any[];
  error?: string;
}

export class XmlParserService {
  /**
   * Parsea un string XML a un objeto JavaScript utilizando xml2js
   * @param xmlString String XML a parsear
   * @returns Promesa con el resultado del parseo
   */
  public static parseXmlString(xmlString: string): Promise<XmlParseResult> {
    return new Promise((resolve) => {
      parseString(xmlString, { explicitArray: false }, (err, result) => {
        if (err) {
          resolve({
            rootName: '',
            parsedData: null,
            error: `Error al parsear XML: ${err.message}`
          });
          return;
        }

        // Obtenemos el nombre de la raíz (primera clave del objeto)
        const rootName = Object.keys(result)[0];
        const parsedData = result[rootName];

        resolve({
          rootName,
          parsedData
        });
      });
    });
  }

  /**
   * Convierte un objeto parseado de XML a componentes de GrapesJS
   * @param parseResult Resultado del parseo de XML
   * @returns Resultado de la conversión con los componentes generados
   */
  public static convertToComponents(parseResult: XmlParseResult): ComponentConversionResult {
    if (!parseResult.parsedData) {
      return {
        success: false,
        components: [],
        error: parseResult.error || 'Datos XML no válidos'
      };
    }

    try {
      const components = this.processNode(parseResult.rootName, parseResult.parsedData);
      return {
        success: true,
        components: Array.isArray(components) ? components : [components]
      };
    } catch (error) {
      return {
        success: false,
        components: [],
        error: `Error en la conversión: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Procesa un nodo del objeto XML parseado y lo convierte a un componente GrapesJS
   * @param nodeName Nombre del nodo
   * @param nodeData Datos del nodo
   * @returns Componente de GrapesJS
   */
  private static processNode(nodeName: string, nodeData: any): any {
    // Componente base
    const component: any = {
      type: 'element',
      tagName: nodeName,
      attributes: {},
      components: []
    };

    // Si el nodo es un string simple, lo tratamos como contenido de texto
    if (typeof nodeData === 'string') {
      component.components = [{ type: 'text', content: nodeData }];
      return component;
    }

    // Procesar atributos
    const attrs = nodeData['$'] || {};
    if (attrs) {
      component.attributes = { ...attrs };
      // Añadimos clases si están presentes
      if (attrs.class) {
        component.classes = attrs.class.split(' ');
      }
      // Añadimos estilos inline si están presentes
      if (attrs.style) {
        component.style = this.parseInlineStyles(attrs.style);
      }
    }

    // Procesar hijos
    Object.keys(nodeData).forEach(key => {
      // Ignoramos la clave de atributos y otros metadatos
      if (key === '$' || key === '_') return;

      const value = nodeData[key];

      // Si es un array, procesamos cada elemento
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'object') {
            component.components.push(this.processNode(key, item));
          } else {
            component.components.push({
              type: 'text',
              content: String(item)
            });
          }
        });
      } else if (typeof value === 'object') {
        // Si es un objeto, lo procesamos como un componente hijo
        component.components.push(this.processNode(key, value));
      } else if (key !== '_' && typeof value !== 'undefined') {
        // Si no es un metadato y no es undefined, lo tratamos como contenido
        component.components.push({
          type: 'text',
          content: String(value)
        });
      }
    });

    // Procesamos el contenido de texto si existe en _
    if (nodeData['_']) {
      component.components.push({
        type: 'text',
        content: nodeData['_']
      });
    }

    return component;
  }

  /**
   * Parsea estilos inline a un objeto de estilos para GrapesJS
   * @param styleString String de estilos CSS inline
   * @returns Objeto de estilos
   */
  private static parseInlineStyles(styleString: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!styleString) return result;

    const styles = styleString.split(';');
    styles.forEach(style => {
      const [property, value] = style.split(':').map(s => s.trim());
      if (property && value) {
        // Convertimos propiedades con guiones a camelCase para GrapesJS
        const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelProperty] = value;
      }
    });

    return result;
  }

  /**
   * Preprocesa un string XML antes de parsearlo
   * @param xmlString String XML a preprocesar
   * @returns String XML preprocesado
   */
  public static preprocessXml(xmlString: string): string {
    // Limpiamos caracteres especiales y aseguramos formato XML válido
    let processedXml = xmlString.trim();
    
    // Aseguramos que hay una declaración XML
    if (!processedXml.startsWith('<?xml')) {
      processedXml = '<?xml version="1.0" encoding="UTF-8"?>\n' + processedXml;
    }
    
    // Convertimos elementos auto-cerrados no estándar a formato estándar XML
    // Por ejemplo: <input name="test"> a <input name="test" />
    processedXml = processedXml.replace(/<([a-zA-Z0-9]+)([^>]*[^\/])>/g, (match, tag, attrs) => {
      // Verificamos si ya tiene cierre
      if (match.includes(`</${tag}>`) || tag.toLowerCase() === 'div' || tag.toLowerCase() === 'span') {
        return match;
      }
      // Convertimos a auto-cerrado si es un elemento HTML que debe auto-cerrarse
      const selfClosingTags = ['input', 'img', 'br', 'hr', 'link', 'meta', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
      if (selfClosingTags.includes(tag.toLowerCase())) {
        return `<${tag}${attrs} />`;
      }
      return match;
    });
    
    return processedXml;
  }
}

export default XmlParserService; 