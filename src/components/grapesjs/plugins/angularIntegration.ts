import { Plugin } from 'grapesjs';

/**
 * Plugin para la integración de GrapesJS con componentes Angular
 */
const angularIntegrationPlugin: Plugin = (editor) => {
  // Añadir tipo de componente para Angular
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
          },
          {
            type: 'text',
            name: 'outputs',
            label: 'Outputs (JSON)'
          }
        ]
      }
    },
    view: {
      init() {
        // Inicialización específica para la vista
        this.listenTo(this.model, 'change:selector change:inputs change:outputs', this.render);
      },
      onRender() {
        const selector = this.model.get('traits')?.where({ name: 'selector' })[0]?.get('value') || '';
        if (selector) {
          this.el.setAttribute('data-angular-component', selector);
        }
      }
    }
  });

  // Añadir bloque para componentes Angular
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

  // Agregar exportador de código para Angular
  editor.Commands.add('export-angular', {
    run: (editor) => {
      const html = editor.getHtml();
      const css = editor.getCss();
      
      // Extraer componentes Angular
      const angularComponents = [];
      const components = editor.DomComponents.getWrapper().find('[data-angular-component]');
      
      for (let i = 0; i < components.length; i++) {
        const component = components[i];
        const selector = component.getAttributes()['data-angular-component'];
        const inputs = component.get('traits')?.where({ name: 'inputs' })[0]?.get('value') || '{}';
        const outputs = component.get('traits')?.where({ name: 'outputs' })[0]?.get('value') || '{}';
        
        angularComponents.push({
          selector,
          inputs: JSON.parse(inputs),
          outputs: JSON.parse(outputs)
        });
      }
      
      return {
        html,
        css,
        angularComponents
      };
    }
  });

  console.log('[GrapesJS] Plugin de integración Angular cargado');
};

export default angularIntegrationPlugin; 