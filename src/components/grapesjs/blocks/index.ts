import { Editor } from 'grapesjs';

// Importación de bloques empresariales
import Dashboard from './business/Dashboard';
import DataTable from './business/DataGrid';
import Form from './business/Form';
import Navigation from './business/Navigation';

// Importación de bloques enterprise
import dataTableBlock from './enterprise/DataTable';
import formBuilderBlock from './enterprise/FormBuilder';

/**
 * Exportación de los bloques individuales para uso directo
 */
export {
  // Bloques business
  Dashboard,
  DataTable,
  Form,
  Navigation,
  
  // Bloques enterprise
  dataTableBlock,
  formBuilderBlock
};

/**
 * Registra todos los bloques business en el editor
 * @param editor Instancia del editor GrapesJS
 */
export const registerBusinessBlocks = (editor: Editor) => {
  Dashboard(editor);
  DataTable(editor);
  Form(editor);
  Navigation(editor);
  
  console.log('Bloques business registrados correctamente');
};

/**
 * Registra todos los bloques enterprise en el editor
 * @param editor Instancia del editor GrapesJS
 */
export const registerEnterpriseBlocks = (editor: Editor) => {
  dataTableBlock(editor);
  formBuilderBlock(editor);
  
  console.log('Bloques enterprise registrados correctamente');
};

/**
 * Registra todos los bloques disponibles en el editor
 * @param editor Instancia del editor GrapesJS
 */
export const registerAllBlocks = (editor: Editor) => {
  registerBusinessBlocks(editor);
  registerEnterpriseBlocks(editor);
  
  console.log('Todos los bloques registrados correctamente');
};

export default registerAllBlocks; 