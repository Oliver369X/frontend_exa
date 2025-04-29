// src/components/ai-code-generation/services/grapesjs-parser.service.ts
/**
 * Servicio para extraer y transformar datos de GrapesJS
 */

interface GrapesJSComponent {
  id?: string;
  cid?: string;
  type?: string;
  tagName?: string;
  content?: string;
  attributes?: Record<string, any>;
  components?: GrapesJSComponent[];
  classes?: {
    models: Array<{id: string}>
  };
}

interface GrapesJSDesign {
  components?: GrapesJSComponent[];
  styles?: any[];
  assets?: any[];
  [key: string]: any;
}

export class GrapesJSParserService {
    /**
     * Extrae información estructurada de un proyecto GrapesJS
     */
    static extractProjectData(projectDesign: GrapesJSDesign | null) {
      if (!projectDesign) return null;
      
      return {
        components: this.extractComponents(projectDesign),
        styles: this.extractStyles(projectDesign),
        structure: this.extractStructure(projectDesign),
        assets: this.extractAssets(projectDesign),
      };
    }
    
    /**
     * Extrae componentes del diseño
     */
    static extractComponents(projectDesign: GrapesJSDesign) {
      try {
        const components = projectDesign.components || [];
        return this.flattenComponents(components);
      } catch (error) {
        console.error('Error al extraer componentes:', error);
        return [];
      }
    }
    
    /**
     * Extrae estilos del diseño
     */
    static extractStyles(projectDesign: GrapesJSDesign) {
      try {
        return projectDesign.styles || [];
      } catch (error) {
        console.error('Error al extraer estilos:', error);
        return [];
      }
    }
    
    /**
     * Extrae la estructura jerárquica del diseño
     */
    static extractStructure(projectDesign: GrapesJSDesign) {
      try {
        const components = projectDesign.components || [];
        return this.buildComponentTree(components);
      } catch (error) {
        console.error('Error al extraer estructura:', error);
        return {};
      }
    }
    
    /**
     * Extrae activos (imágenes, etc.) del diseño
     */
    static extractAssets(projectDesign: GrapesJSDesign) {
      try {
        return projectDesign.assets || [];
      } catch (error) {
        console.error('Error al extraer activos:', error);
        return [];
      }
    }
    
    /**
     * Construye un árbol de componentes
     */
    private static buildComponentTree(components: GrapesJSComponent[], parentId: string = '') {
      const result: any = {};
      
      components.forEach(component => {
        const id = component.id || component.cid;
        if (!id) return;
        
        result[id] = {
          id,
          type: component.type,
          tagName: component.tagName,
          attributes: component.attributes || {},
          children: component.components ? 
            this.buildComponentTree(component.components, id) : 
            {}
        };
      });
      
      return result;
    }
    
    /**
     * Aplana la estructura de componentes para fácil acceso
     */
    private static flattenComponents(components: GrapesJSComponent[], result: any[] = [], parentId: string = '') {
      components.forEach(component => {
        const id = component.id || component.cid;
        if (!id) return;
        
        const flatComponent = {
          id,
          parentId,
          type: component.type,
          tagName: component.tagName,
          content: component.content,
          attributes: component.attributes || {},
          classes: component.classes ? component.classes.models.map((c: any) => c.id) : [],
        };
        
        result.push(flatComponent);
        
        if (component.components) {
          this.flattenComponents(component.components, result, id);
        }
      });
      
      return result;
    }
  }