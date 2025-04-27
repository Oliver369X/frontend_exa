import { Plugin } from 'grapesjs';

/**
 * Plugin para integración con Angular en GrapesJS
 * Permite exportar el proyecto como componentes de Angular
 */
const angularIntegrationPlugin: Plugin = (editor) => {
  // Registrar tipos de componentes específicos para Angular
  const domc = editor.DomComponents;
  
  // Componente Angular con inputs y outputs
  domc.addType('angular-component', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: true,
        attributes: { class: 'angular-component' },
        traits: [
          {
            type: 'text',
            name: 'componentName',
            label: 'Nombre del Componente'
          },
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
    }
  });

  // Componente de servicio Angular
  domc.addType('angular-service', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: false,
        attributes: { class: 'angular-service' },
        traits: [
          {
            type: 'text',
            name: 'serviceName',
            label: 'Nombre del Servicio'
          },
          {
            type: 'text',
            name: 'methods',
            label: 'Métodos (JSON)'
          },
          {
            type: 'checkbox',
            name: 'providedInRoot',
            label: 'Provided in Root'
          }
        ]
      }
    }
  });

  // Componente de módulo Angular
  domc.addType('angular-module', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: false,
        attributes: { class: 'angular-module' },
        traits: [
          {
            type: 'text',
            name: 'moduleName',
            label: 'Nombre del Módulo'
          },
          {
            type: 'text',
            name: 'declarations',
            label: 'Declarations (CSV)'
          },
          {
            type: 'text',
            name: 'imports',
            label: 'Imports (CSV)'
          },
          {
            type: 'text',
            name: 'exports',
            label: 'Exports (CSV)'
          }
        ]
      }
    }
  });

  // Componente de ruta Angular
  domc.addType('angular-route', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: false,
        attributes: { class: 'angular-route' },
        traits: [
          {
            type: 'text',
            name: 'path',
            label: 'Ruta'
          },
          {
            type: 'text',
            name: 'component',
            label: 'Componente'
          },
          {
            type: 'checkbox',
            name: 'canActivate',
            label: 'Protegida (Auth Guard)'
          }
        ]
      }
    }
  });

  // Agregar bloques al BlockManager
  editor.BlockManager.add('angular-component-block', {
    label: 'Componente Angular',
    category: 'Angular',
    content: {
      type: 'angular-component',
      content: `<div class="angular-component-placeholder p-3 border rounded bg-light text-center">
        <i class="fab fa-angular fa-2x mb-2" style="color: #dd0031;"></i>
        <p>Componente Angular</p>
        <small>Configura propiedades en el panel de atributos</small>
      </div>`
    }
  });

  editor.BlockManager.add('angular-service-block', {
    label: 'Servicio Angular',
    category: 'Angular',
    content: {
      type: 'angular-service',
      content: `<div class="angular-service-placeholder p-3 border rounded bg-light text-center">
        <i class="fas fa-cogs fa-2x mb-2" style="color: #dd0031;"></i>
        <p>Servicio Angular</p>
        <small>Configura propiedades en el panel de atributos</small>
      </div>`
    }
  });

  editor.BlockManager.add('angular-module-block', {
    label: 'Módulo Angular',
    category: 'Angular',
    content: {
      type: 'angular-module',
      content: `<div class="angular-module-placeholder p-3 border rounded bg-light text-center">
        <i class="fas fa-cubes fa-2x mb-2" style="color: #dd0031;"></i>
        <p>Módulo Angular</p>
        <small>Configura propiedades en el panel de atributos</small>
      </div>`
    }
  });

  editor.BlockManager.add('angular-route-block', {
    label: 'Ruta Angular',
    category: 'Angular',
    content: {
      type: 'angular-route',
      content: `<div class="angular-route-placeholder p-3 border rounded bg-light text-center">
        <i class="fas fa-route fa-2x mb-2" style="color: #dd0031;"></i>
        <p>Ruta Angular</p>
        <small>Configura propiedades en el panel de atributos</small>
      </div>`
    }
  });

  // Función para generar código TypeScript para componentes Angular
  const generateAngularComponent = (component) => {
    const name = component.get('traits').where({ name: 'componentName' })[0]?.get('value') || 'MyComponent';
    const selector = component.get('traits').where({ name: 'selector' })[0]?.get('value') || `app-${name.toLowerCase()}`;
    
    let inputsString = '';
    let inputsRaw = component.get('traits').where({ name: 'inputs' })[0]?.get('value') || '[]';
    try {
      const inputs = JSON.parse(inputsRaw);
      inputsString = inputs.map(input => {
        return `@Input() ${input.name}: ${input.type};`;
      }).join('\n  ');
    } catch (e) {
      console.error('Error al analizar los inputs:', e);
    }
    
    let outputsString = '';
    let outputsRaw = component.get('traits').where({ name: 'outputs' })[0]?.get('value') || '[]';
    try {
      const outputs = JSON.parse(outputsRaw);
      outputsString = outputs.map(output => {
        return `@Output() ${output.name} = new EventEmitter<${output.type}>();`;
      }).join('\n  ');
    } catch (e) {
      console.error('Error al analizar los outputs:', e);
    }
    
    // Extraer HTML del componente
    let htmlContent = '';
    component.get('components').forEach(child => {
      htmlContent += child.toHTML();
    });
    
    // Generar código TypeScript del componente
    const tsCode = `import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: '${selector}',
  templateUrl: './${name.toLowerCase()}.component.html',
  styleUrls: ['./${name.toLowerCase()}.component.scss']
})
export class ${name}Component {
  ${inputsString}
  ${outputsString}
}`;

    return {
      ts: tsCode,
      html: htmlContent
    };
  };

  // Comando para exportar como proyecto Angular
  editor.Commands.add('export-angular', {
    run: () => {
      let angularComponents = [];
      const components = editor.DomComponents.getWrapper().find('[data-gjs-type="angular-component"]');
      
      components.forEach(component => {
        angularComponents.push(generateAngularComponent(component));
      });
      
      // Verificar si hay componentes Angular
      if (angularComponents.length === 0) {
        alert('No se encontraron componentes de Angular para exportar.');
        return;
      }
      
      // Crear un paquete zip con los archivos generados
      try {
        const JSZip = require('jszip');
        const zip = new JSZip();
        const folder = zip.folder("angular-project");
        
        // Agregar componentes al zip
        angularComponents.forEach((component, index) => {
          const name = components[index].get('traits').where({ name: 'componentName' })[0]?.get('value') || `Component${index + 1}`;
          const fileName = name.toLowerCase();
          
          folder.file(`${fileName}.component.ts`, component.ts);
          folder.file(`${fileName}.component.html`, component.html);
          folder.file(`${fileName}.component.scss`, "");
        });
        
        // Generar y descargar el zip
        zip.generateAsync({ type: 'blob' }).then(function(content) {
          const a = document.createElement('a');
          const url = URL.createObjectURL(content);
          a.href = url;
          a.download = 'angular-project.zip';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          }, 0);
        });
      } catch (error) {
        console.error('Error al generar el archivo ZIP:', error);
        alert('Error al exportar el proyecto Angular. La librería JSZip puede no estar disponible.');
        
        // Alternativa: mostrar el código
        let codeOutput = '';
        angularComponents.forEach((component, index) => {
          const name = components[index].get('traits').where({ name: 'componentName' })[0]?.get('value') || `Component${index + 1}`;
          codeOutput += `\n// ${name}.component.ts\n${component.ts}\n\n// ${name}.component.html\n${component.html}\n\n`;
        });
        
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
        modal.style.zIndex = '10000';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        
        const content = document.createElement('div');
        content.style.backgroundColor = 'white';
        content.style.padding = '20px';
        content.style.borderRadius = '5px';
        content.style.maxWidth = '80%';
        content.style.maxHeight = '80%';
        content.style.overflow = 'auto';
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Cerrar';
        closeBtn.style.marginBottom = '10px';
        closeBtn.addEventListener('click', () => modal.remove());
        
        const code = document.createElement('pre');
        code.style.whiteSpace = 'pre-wrap';
        code.style.overflow = 'auto';
        code.style.maxHeight = '500px';
        code.textContent = codeOutput;
        
        content.appendChild(closeBtn);
        content.appendChild(code);
        modal.appendChild(content);
        document.body.appendChild(modal);
      }
    }
  });
  
  // Añadir botón de exportación a Angular en la barra de herramientas
  editor.Panels.addButton('options', {
    id: 'export-angular',
    className: 'fa fa-angular',
    command: 'export-angular',
    attributes: { title: 'Exportar a Angular' }
  });
  
  console.log('Plugin de integración con Angular cargado correctamente');
};

export default angularIntegrationPlugin; 