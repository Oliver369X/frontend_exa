import { Plugin } from 'grapesjs';
import businessBlocks from './businessBlocks';
import enterpriseBlocks from './enterpriseBlocks';
import pageManagerPlugin from './pageManager';
import angularIntegrationPlugin from './angularIntegration';

/**
 * Exportación de los plugins individuales para uso directo
 */
export {
  businessBlocks,
  enterpriseBlocks,
  pageManagerPlugin,
  angularIntegrationPlugin
};

/**
 * Plugin combinado que registra todos los bloques disponibles
 * @param editor Instancia del editor GrapesJS
 */
const allPlugins: Plugin = (editor) => {
  // Registrar todos los plugins
  businessBlocks(editor);
  enterpriseBlocks(editor);
  pageManagerPlugin(editor);
  angularIntegrationPlugin(editor);
  
  console.log('Todos los plugins cargados correctamente');
};

export default allPlugins; 