import { Plugin } from 'grapesjs';
import businessBlocks from './businessBlocks';
import enterpriseBlocks from './enterpriseBlocks';
import pageManagerPlugin from './pageManager';
import angularIntegrationPlugin from './angularIntegration';
import importPlugin from './import-plugin';
import checkListBlock from './checkListBlock';

// Configuración global para controlar plugins intensivos
const ENABLE_HIGH_PERFORMANCE_MODE = true;

/**
 * Exportación de los plugins individuales para uso directo
 */
export {
  businessBlocks,
  enterpriseBlocks,
  pageManagerPlugin,
  angularIntegrationPlugin,
  importPlugin,
  checkListBlock
};

/**
 * Plugin combinado que registra todos los bloques disponibles
 * @param editor Instancia del editor GrapesJS
 */
const allPlugins: Plugin = (editor) => {
  // Plugins principales (siempre cargados)
  businessBlocks(editor, {});
  enterpriseBlocks(editor, {});
  pageManagerPlugin(editor, {});
  angularIntegrationPlugin(editor, {});
  importPlugin(editor, {});
  checkListBlock(editor, {});
  
  // Plugins opcionales basados en rendimiento
  if (!ENABLE_HIGH_PERFORMANCE_MODE) {
    // Cargar el plugin de checklist solo si no estamos en modo de alto rendimiento
    console.log('[Plugins] Cargando plugins adicionales (modo rendimiento: normal)');
    checkListBlock(editor, {});
  } else {
    console.log('[Plugins] Modo de alto rendimiento activado, algunos plugins no se cargarán');
  }
  
  console.log('[Plugins] Todos los plugins esenciales cargados correctamente');
};

export default allPlugins; 