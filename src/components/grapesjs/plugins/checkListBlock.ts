import { Plugin } from 'grapesjs';
import type { Component, Editor } from 'grapesjs';

interface CheckboxElement extends HTMLInputElement {
  checked: boolean;
}

interface StyledElement extends HTMLElement {
  style: CSSStyleDeclaration;
}

type EventsHash = {
  [key: string]: string;
};

/**
 * Plugin para crear un bloque de lista de verificación (checklist) optimizado para rendimiento
 */
const checkListBlock: Plugin = (editor: Editor) => {
  // Contador para limitar la cantidad de items permitidos
  const MAX_ITEMS = 10;
  let itemCount = 0;
  
  // Registro de listeners para limpieza
  const listeners: Array<{element: HTMLElement, event: string, handler: Function}> = [];
  
  // Limpieza de listeners al desmontar
  const cleanupListeners = () => {
    listeners.forEach(item => {
      item.element.removeEventListener(item.event, item.handler as EventListenerOrEventListenerObject);
    });
    listeners.length = 0; // Vaciar array
  };
  
  // Registra un componente al crearlo para limpieza posterior
  const registerComponentListener = (el: HTMLElement, event: string, handler: Function) => {
    el.addEventListener(event, handler as EventListenerOrEventListenerObject);
    listeners.push({element: el, event, handler});
  };

  // Agregar tipo de componente personalizado para checklist
  editor.DomComponents.addType('checklist-container', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: true,
        attributes: { class: 'checklist-container p-3 border rounded' },
        traits: [
          {
            type: 'text',
            name: 'title',
            label: 'Título'
          }
        ]
      },
      init() {
        this.on('component:mount', this.onMount);
        this.on('component:remove', this.onRemove);
      },
      onMount() {
        itemCount = this.find('[data-gjs-type="checklist-item"]').length;
      },
      onRemove() {
        cleanupListeners();
      }
    },
    view: {
      init() {
        this.listenTo(this.model, 'change:traits', this.updateTitle);
      },
      updateTitle() {
        const traits = this.model.get('traits');
        if (!traits) return;
        
        const titleTrait = traits.where({ name: 'title' })[0];
        const title = titleTrait?.get('value') || 'Lista de Tareas';
        
        const titleEl = this.el.querySelector('.checklist-title');
        if (titleEl) {
          titleEl.textContent = title;
        }
      },
      onRender() {
        // Optimización: solo ejecutar una vez
        if (!this.rendered) {
          this.updateTitle();
          this.rendered = true;
          
          // Agregar listener al botón de agregar tarea
          const addBtn = this.el.querySelector('.add-task-btn');
          if (addBtn) {
            const handleAddItem = () => {
              if (itemCount < MAX_ITEMS) {
                editor.runCommand('add-checklist-item');
              } else {
                alert(`Máximo de ${MAX_ITEMS} items alcanzado`);
              }
            };
            
            registerComponentListener(addBtn as HTMLElement, 'click', handleAddItem);
          }
        }
      }
    }
  });

  // Tipo de componente para un elemento de la lista
  editor.DomComponents.addType('checklist-item', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: false,
        attributes: { 
          class: 'checklist-item d-flex align-items-center mb-2',
          'data-completed': 'false'
        },
        traits: [
          {
            type: 'text',
            name: 'taskText',
            label: 'Tarea'
          },
          {
            type: 'checkbox',
            name: 'completed',
            label: 'Completada'
          }
        ]
      },
      init() {
        // Incrementar contador de items
        itemCount++;
        
        this.on('component:remove', () => {
          // Decrementar contador de items
          itemCount--;
        });
      }
    },
    view: {
      init() {
        this.listenTo(this.model, 'change:traits', this.updateView);
        this.model.on('component:mount', this.bindEvents.bind(this));
      },
      updateView() {
        const traits = this.model.get('traits');
        if (!traits) return;
        
        const taskTextTrait = traits.where({ name: 'taskText' })[0];
        const completedTrait = traits.where({ name: 'completed' })[0];
        
        const taskText = taskTextTrait?.get('value') || 'Nueva tarea';
        const completed = completedTrait?.get('value') || false;
        
        // Actualizar atributo en el modelo para evitar re-renders innecesarios
        this.model.set('attributes', {
          ...this.model.get('attributes'),
          'data-completed': completed ? 'true' : 'false'
        });
        
        this.updateDOM(taskText, completed);
      },
      
      updateDOM(taskText: string, completed: boolean) {
        // Actualizar la interfaz según el estado
        const checkboxEl = this.el.querySelector('input[type="checkbox"]') as CheckboxElement;
        const textEl = this.el.querySelector('.task-text') as StyledElement;
        
        if (checkboxEl && checkboxEl.checked !== completed) {
          checkboxEl.checked = completed;
        }
        
        if (textEl) {
          if (textEl.textContent !== taskText) {
            textEl.textContent = taskText;
          }
          
          textEl.style.textDecoration = completed ? 'line-through' : 'none';
          textEl.style.color = completed ? '#888' : '#000';
        }
      },
      
      bindEvents() {
        // Optimización: Evitar registrar listeners múltiples
        if (this.eventsbound) return;
        
        const checkboxEl = this.el.querySelector('input[type="checkbox"]');
        if (!checkboxEl) return;
        
        const handleChange = (e: Event) => {
          const target = e.target as CheckboxElement;
          const completed = target.checked;
          
          const traits = this.model.get('traits');
          if (!traits) return;
          
          const traitModel = traits.where({ name: 'completed' })[0];
          
          if (traitModel) {
            traitModel.set('value', completed);
          }
          
          // Actualizar atributo en el modelo
          this.model.set('attributes', {
            ...this.model.get('attributes'),
            'data-completed': completed ? 'true' : 'false'
          });
          
          // Actualizar estilos visualmente - mínimo para rendimiento
          const textEl = this.el.querySelector('.task-text') as StyledElement;
          if (textEl) {
            textEl.style.textDecoration = completed ? 'line-through' : 'none';
            textEl.style.color = completed ? '#888' : '#000';
          }
        };
        
        registerComponentListener(checkboxEl as HTMLElement, 'change', handleChange);
        this.eventsbound = true;
      },
      
      onRender() {
        if (!this.rendered) {
          this.updateView();
          this.bindEvents();
          this.rendered = true;
        }
      }
    }
  });

  // Agregar bloque para el checklist en el panel de bloques (más ligero)
  editor.BlockManager.add('checklist', {
    label: 'Lista de Tareas',
    category: 'Formularios',
    content: {
      type: 'checklist-container',
      content: `
        <h4 class="checklist-title mb-3">Lista de Tareas</h4>
        <div class="checklist-items">
          <div data-gjs-type="checklist-item">
            <input type="checkbox" class="form-check-input me-2">
            <span class="task-text">Tarea por hacer</span>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-primary mt-2 add-task-btn">Agregar tarea</button>
      `
    },
    attributes: {
      class: 'fa fa-check-square'
    }
  });

  // Añadir comando para agregar nuevas tareas
  editor.Commands.add('add-checklist-item', {
    run(editor) {
      // Limitar a MAX_ITEMS
      if (itemCount >= MAX_ITEMS) {
        console.warn(`Máximo de ${MAX_ITEMS} items alcanzado`);
        return;
      }
      
      const selected = editor.getSelected();
      if (!selected) return;
      
      // Buscar el contenedor de elementos checklist más cercano
      let container: Component | null = null;
      
      if (selected.get('type') === 'checklist-container') {
        const items = selected.find('.checklist-items');
        container = items.length > 0 ? items[0] : null;
      } else if (selected.get('type') === 'checklist-item') {
        container = selected.parent();
      } else {
        const parent = selected.parent();
        if (parent && parent.get('type') === 'checklist-container') {
          const items = parent.find('.checklist-items');
          container = items.length > 0 ? items[0] : null;
        }
      }
      
      if (container) {
        const newItem = {
          type: 'checklist-item',
          content: `
            <input type="checkbox" class="form-check-input me-2">
            <span class="task-text">Nueva tarea</span>
          `
        };
        
        container.append(newItem);
      }
    }
  });

  // Limpiar recursos al desmontar el plugin
  editor.on('component:remove', (component: Component) => {
    if (component.get('type') === 'checklist-container') {
      cleanupListeners();
    }
  });

  console.log('[GrapesJS] Plugin de checklist optimizado cargado');
  
  // Devolver API para poder desactivar el plugin si es necesario
  return {
    name: 'checklist-block',
    cleanup: cleanupListeners
  };
};

export default checkListBlock; 