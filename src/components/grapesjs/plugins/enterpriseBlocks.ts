import { Plugin } from 'grapesjs';
import { registerEnterpriseBlocks } from '../blocks';
/**
 * Plugin que registra todos los componentes empresariales en GrapesJS
 */
const enterpriseBlocks: Plugin = (editor) => {
  // Añadir nueva categoría para componentes empresariales
  editor.BlockManager.getCategories().reset([
    { id: 'Básicos', label: 'Básicos' },
    { id: 'Formularios', label: 'Formularios' },
    { id: 'Tablas', label: 'Tablas' },
    { id: 'Componentes', label: 'Componentes' },
    { id: 'Navegación', label: 'Navegación' },
    { id: 'Aplicaciones', label: 'Aplicaciones Empresariales' },
    
  ]);

  // Registrar componentes empresariales desde el índice centralizado
  registerEnterpriseBlocks(editor);

  // Añadir CSS para los componentes empresariales
  editor.getConfig().canvas.styles.push(
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'
  );

  // Añadir JS para los componentes empresariales
  editor.getConfig().canvas.scripts.push(
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js'
  );

  // Agregar comandos para interactuar con componentes empresariales
  editor.Commands.add('enterprise:fill-data', {
    run: (editor, sender, options = {}) => {
      const selected = editor.getSelected();
      if (!selected) return;

      // Si es una tabla de datos, cargar datos de muestra
      if (selected.get('type') === 'enterprise-data-table') {
        const sampleData = [
          { id: 1, nombre: 'Juan Pérez', email: 'juan@ejemplo.com', telefono: '+34 612 345 678', fecha: '01/01/2023', estado: 'Activo' },
          { id: 2, nombre: 'María García', email: 'maria@ejemplo.com', telefono: '+34 623 456 789', fecha: '15/02/2023', estado: 'Pendiente' },
          { id: 3, nombre: 'Carlos López', email: 'carlos@ejemplo.com', telefono: '+34 634 567 890', fecha: '20/03/2023', estado: 'Inactivo' },
          { id: 4, nombre: 'Ana Martínez', email: 'ana@ejemplo.com', telefono: '+34 645 678 901', fecha: '10/04/2023', estado: 'Activo' },
          { id: 5, nombre: 'Pedro Sánchez', email: 'pedro@ejemplo.com', telefono: '+34 656 789 012', fecha: '05/05/2023', estado: 'Pendiente' }
        ];

        // Emular carga de datos
        selected.set('apiData', sampleData);
        editor.trigger('enterprise:data-loaded', { component: selected, data: sampleData });
      }
    }
  });

  // Añadir panel específico para componentes empresariales
  const panelManager = editor.Panels;
  
  panelManager.addPanel({
    id: 'panel-enterprise',
    visible: true,
    buttons: [{
      id: 'enterprise-fill-data',
      label: 'Cargar Datos',
      command: 'enterprise:fill-data',
      attributes: { title: 'Cargar datos de muestra' }
    }]
  });

  // Registrar tipos de componentes para compatibilidad con React/Angular
  editor.DomComponents.addType('react-component', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: true,
        attributes: { class: 'react-component' },
        traits: [
          {
            type: 'text',
            name: 'componentName',
            label: 'Nombre del Componente'
          },
          {
            type: 'text',
            name: 'props',
            label: 'Props (JSON)'
          }
        ]
      }
    }
  });
  editor.BlockManager.add('enterprise-checklist', {
    label: 'Checklist Empresarial',
    category: 'Aplicaciones',
    content: {
      type: 'checklist-container',
      content: `<div class="checklist-container p-3 border rounded">
        <div class="checklist-title mb-2">Lista de Tareas</div>
        <div class="checklist-items">
          <div data-gjs-type="checklist-item">
            <input type="checkbox" class="form-check-input me-2">
            <span class="task-text">Tarea de ejemplo</span>
          </div>
          <div data-gjs-type="checklist-item">
            <input type="checkbox" class="form-check-input me-2">
            <span class="task-text">Tarea de ejemplo</span>
          </div>
          <div data-gjs-type="checklist-item">
            <input type="checkbox" class="form-check-input me-2">
            <span class="task-text">Tarea de ejemplo</span>
          </div>
          <div data-gjs-type="checklist-item">
            <input type="checkbox" class="form-check-input me-2">
            <span class="task-text">Tarea de ejemplo</span>
          </div>
        </div>
        <button class="btn btn-sm btn-primary mt-2 add-task-btn">Añadir tarea</button>
      </div>`
    }
  });

  editor.DomComponents.addType('angular-component', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: true,
        attributes: { class: 'angular-component' },
        traits: [
          {
            type: 'text',
            name: 'selector',
            label: 'Selector'
          },
          {
            type: 'text',
            name: 'inputs',
            label: 'Inputs (JSON)'
          }
        ]
      }
    }
  });

  // Agregar bloques para React y Angular
  editor.BlockManager.add('react-component', {
    label: 'Componente React',
    category: 'Aplicaciones',
    content: {
      type: 'react-component',
      content: `<div class="react-component-placeholder p-3 border rounded bg-light text-center">
        <i class="fab fa-react fa-2x mb-2"></i>
        <p>Componente React</p>
        <small>Configura el nombre y props en el panel de propiedades</small>
      </div>`
    }
  });

  editor.BlockManager.add('angular-component', {
    label: 'Componente Angular',
    category: 'Aplicaciones',
    content: {
      type: 'angular-component',
      content: `<div class="angular-component-placeholder p-3 border rounded bg-light text-center">
        <i class="fab fa-angular fa-2x mb-2"></i>
        <p>Componente Angular</p>
        <small>Configura el selector y inputs en el panel de propiedades</small>
      </div>`
    }
  });

  


  // Registro del plugin completado
  console.log('Plugin de componentes empresariales cargado correctamente');
};

export default enterpriseBlocks; 