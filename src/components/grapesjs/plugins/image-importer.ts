import { Editor, Plugin } from 'grapesjs';
import GrapesJSBridgeService from '../service/grapesjs-bridge.service';

type ImageAnalysisResult = {
  description: string;
  tags: string[];
  dominantColors: string[];
  suggestedComponents: {
    type: string;
    attributes: Record<string, any>;
    content?: string;
  }[];
};

/**
 * Plugin para mejorar la importación de imágenes con análisis mediante IA
 * y conversión a componentes GrapesJS
 */
const ImageImporterPlugin: Plugin = {
  name: 'image-importer-plugin',
  
  init(editor: Editor) {
    // Referencias a servicios
    const bridgeService = GrapesJSBridgeService.getInstance();
    
    // Registrar comando para procesar imagen y crear componentes
    editor.Commands.add('convert-image-to-components', {
      run: async (editor, sender, options = {}) => {
        const { imageUrl, imageId } = options as { imageUrl: string; imageId?: string };
        
        if (!imageUrl) {
          editor.Toast.add({
            content: 'Se requiere una URL de imagen para la conversión',
            type: 'error',
          });
          return false;
        }
        
        try {
          editor.Toast.add({
            content: 'Analizando imagen y creando componentes...',
            type: 'info',
          });
          
          // Solicitar análisis de la imagen
          const analysisResult = await analyzeImage(imageUrl);
          
          if (!analysisResult) {
            throw new Error('No se pudo analizar la imagen');
          }
          
          // Crear componentes basados en el análisis
          const createdComponents = createComponentsFromAnalysis(editor, imageUrl, analysisResult);
          
          if (!createdComponents || createdComponents.length === 0) {
            throw new Error('No se pudieron crear componentes');
          }
          
          editor.Toast.add({
            content: `Se crearon ${createdComponents.length} componentes basados en la imagen`,
            type: 'success',
          });
          
          return createdComponents;
        } catch (error) {
          console.error('Error al convertir imagen a componentes:', error);
          editor.Toast.add({
            content: 'Error al convertir imagen a componentes',
            type: 'error',
          });
          
          // Si hay error, crear un componente de imagen básico
          const component = editor.DomComponents.addComponent({
            type: 'image',
            attributes: { src: imageUrl, alt: 'Imagen importada' }
          });
          
          return [component];
        }
      }
    });
    
    // Extender el Asset Manager para añadir opción de convertir a componentes
    const am = editor.AssetManager;
    const assetEvents = am.events;
    
    // Agregar botón en el panel de opciones de cada imagen
    am.on(assetEvents.add, (asset) => {
      const imageUrl = asset.get('src');
      
      // Añadir botón para convertir a componentes
      setTimeout(() => {
        const assetEl = am.getContainer().querySelector(`[data-asset-id="${asset.get('id')}"]`);
        
        if (assetEl && !assetEl.querySelector('.convert-to-components-btn')) {
          const optionsEl = document.createElement('div');
          optionsEl.className = 'convert-to-components-btn';
          optionsEl.innerHTML = `
            <button title="Convertir a componentes">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"></path>
              </svg>
            </button>
          `;
          
          optionsEl.querySelector('button')?.addEventListener('click', (e) => {
            e.stopPropagation();
            editor.runCommand('convert-image-to-components', { imageUrl, imageId: asset.get('id') });
          });
          
          assetEl.appendChild(optionsEl);
          
          // Estilos para el botón
          const style = document.createElement('style');
          style.innerHTML = `
            .convert-to-components-btn {
              position: absolute;
              top: 5px;
              right: 5px;
              z-index: 100;
            }
            .convert-to-components-btn button {
              background-color: rgba(0,0,0,0.5);
              color: white;
              border: none;
              border-radius: 3px;
              padding: 3px;
              cursor: pointer;
              transition: all 0.2s;
            }
            .convert-to-components-btn button:hover {
              background-color: rgba(0,0,0,0.8);
            }
            .convert-to-components-btn svg {
              fill: white;
            }
          `;
          document.head.appendChild(style);
        }
      }, 100);
    });
    
    // Modificar el comportamiento del drop de imágenes
    editor.on('asset:add', (asset) => {
      if (asset.get('type') === 'image') {
        // No hacer nada especial por ahora, dejar que el comportamiento por defecto funcione
      }
    });

    // Función principal para analizar la imagen mediante IA
    async function analyzeImage(imageUrl: string): Promise<ImageAnalysisResult | null> {
      try {
        // Primero intentamos usar la API local si está disponible
        const response = await fetch('/api/ai/analyze-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl }),
        });
        
        if (response.ok) {
          return await response.json();
        }
        
        // Si no hay API local, usamos el análisis básico
        return await basicImageAnalysis(imageUrl);
      } catch (error) {
        console.error('Error al analizar imagen:', error);
        return await basicImageAnalysis(imageUrl);
      }
    }
    
    // Análisis básico sin IA cuando no está disponible la API
    async function basicImageAnalysis(imageUrl: string): Promise<ImageAnalysisResult> {
      // Extraer nombre de archivo como descripción
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1].split('?')[0];
      const fileNameWithoutExt = fileName.split('.')[0].replace(/[-_]/g, ' ');
      
      return {
        description: fileNameWithoutExt || 'Imagen importada',
        tags: ['imagen', 'importada'],
        dominantColors: ['#cccccc'],
        suggestedComponents: [{
          type: 'image',
          attributes: {
            src: imageUrl,
            alt: fileNameWithoutExt || 'Imagen importada',
            style: {
              'max-width': '100%',
              'height': 'auto'
            }
          }
        }]
      };
    }
    
    // Crear componentes a partir del análisis
    function createComponentsFromAnalysis(
      editor: Editor, 
      imageUrl: string, 
      analysis: ImageAnalysisResult
    ): any[] {
      const components = [];
      
      // Componente contenedor
      const container = editor.DomComponents.addComponent({
        type: 'wrapper',
        tagName: 'div',
        attributes: {
          class: 'image-component-wrapper',
          style: {
            'position': 'relative',
            'margin-bottom': '20px'
          }
        },
        components: []
      });
      
      components.push(container);
      
      // Añadir imagen
      const imageComponent = editor.DomComponents.addComponent({
        type: 'image',
        attributes: {
          src: imageUrl,
          alt: analysis.description,
          title: analysis.description,
          style: {
            'max-width': '100%',
            'height': 'auto',
            'display': 'block'
          }
        }
      }, { at: container });
      
      // Añadir componentes sugeridos por el análisis
      if (analysis.suggestedComponents && analysis.suggestedComponents.length > 0) {
        analysis.suggestedComponents.forEach(suggestion => {
          if (suggestion.type !== 'image') { // Evitar duplicar la imagen
            const component = editor.DomComponents.addComponent({
              type: suggestion.type,
              attributes: suggestion.attributes,
              content: suggestion.content || ''
            }, { at: container });
          }
        });
      }
      
      return components;
    }
  }
};

export default ImageImporterPlugin; 