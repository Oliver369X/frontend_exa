import { Plugin } from 'grapesjs';
import { registerBusinessBlocks } from '../blocks';

/**
 * Plugin que registra todos los componentes de negocios en GrapesJS
 */
const businessBlocks: Plugin = (editor) => {
  // Registrar la categoría para bloques empresariales
  const blockManager = editor.BlockManager;
  const categoryName = 'Negocios';
  
  // Añadir CSS externo para los componentes empresariales
  editor.AssetManager.add([
    {
      type: 'css',
      src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css',
    },
    {
      type: 'css',
      src: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    },
  ]);

  // Añadir JS externo para funcionalidades avanzadas
  editor.AssetManager.add([
    {
      type: 'js',
      src: 'https://cdn.jsdelivr.net/npm/chart.js'
    },
    {
      type: 'js',
      src: 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js'
    }
  ]);

  // Registrar componentes desde el índice centralizado
  registerBusinessBlocks(editor);

  // Crear un comando para refrescar datos en los componentes
  editor.Commands.add('refresh-business-component', {
    run: (editor) => {
      const selectedComponent = editor.getSelected();
      if (!selectedComponent) return false;

      const type = selectedComponent.get('type');
      
      if (type === 'business-data-table') {
        // Lógica para refrescar tabla de datos
        console.log('Refrescando tabla de datos');
        // Aquí podríamos llamar a una función específica del componente
        // o enviar un evento que el componente escuche
        selectedComponent.view.el.querySelector('.refresh-btn')?.click();
      } 
      else if (type === 'business-dashboard') {
        // Lógica para refrescar dashboard
        console.log('Refrescando dashboard');
        selectedComponent.view.el.querySelector('.refresh-btn')?.click();
      }
      else if (type === 'business-form') {
        // Lógica para resetear formulario
        console.log('Reseteando formulario');
        selectedComponent.view.el.querySelector('form')?.reset();
      }

      return true;
    }
  });

  // Añadir panel para componentes empresariales
  editor.Panels.addPanel({
    id: 'business-panel',
    visible: true,
    buttons: [
      {
        id: 'refresh-data',
        label: 'Refrescar datos',
        command: 'refresh-business-component',
        attributes: { 
          title: 'Actualizar datos del componente seleccionado',
          class: 'fa fa-refresh'
        }
      }
    ]
  });

  console.log('Plugin de componentes empresariales cargado correctamente');
};

export default businessBlocks; 