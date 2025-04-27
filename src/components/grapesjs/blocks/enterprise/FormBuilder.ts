import { Editor } from 'grapesjs';

export default function (editor: Editor) {
  const domc = editor.DomComponents;
  const defaultType = domc.getType('default');
  const defaultModel = defaultType.model;

  // Registrar el tipo de componente para el constructor de formularios
  domc.addType('enterprise-form-builder', {
    model: {
      defaults: {
        ...defaultModel.prototype.defaults,
        droppable: true,
        attributes: { class: 'enterprise-form-builder' },
        traits: [
          {
            type: 'select',
            name: 'formMethod',
            label: 'Método',
            options: [
              { id: 'get', name: 'GET' },
              { id: 'post', name: 'POST' },
              { id: 'put', name: 'PUT' },
            ]
          },
          {
            type: 'text',
            name: 'formAction',
            label: 'Endpoint API'
          },
          {
            type: 'checkbox',
            name: 'validation',
            label: 'Validación'
          },
          {
            type: 'checkbox',
            name: 'responsive',
            label: 'Responsive'
          },
          {
            type: 'select',
            name: 'layout',
            label: 'Diseño',
            options: [
              { id: 'vertical', name: 'Vertical' },
              { id: 'horizontal', name: 'Horizontal' },
              { id: 'inline', name: 'Inline' },
            ]
          }
        ],
        'script-props': ['formMethod', 'formAction', 'validation', 'responsive', 'layout'],
        script() {
          const props = this.props;
          const formEl = this.el;
          
          // Configurar el formulario según las propiedades
          if (formEl.tagName === 'FORM') {
            formEl.method = props.formMethod || 'post';
            formEl.action = props.formAction || '';
            
            // Manejar el envío del formulario
            formEl.addEventListener('submit', async function(e) {
              e.preventDefault();
              
              // Si la validación está habilitada, verificar que todos los campos sean válidos
              if (props.validation) {
                const isValid = formEl.checkValidity();
                formEl.classList.add('was-validated');
                
                if (!isValid) {
                  return;
                }
              }
              
              // Recopilar los datos del formulario
              const formData = new FormData(formEl);
              const data = Object.fromEntries(formData.entries());
              
              try {
                // Mostrar indicador de carga
                const submitBtn = formEl.querySelector('[type="submit"]');
                if (submitBtn) {
                  const originalText = submitBtn.innerHTML;
                  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Enviando...';
                  submitBtn.disabled = true;
                }
                
                // Realizar la solicitud al servidor
                const response = await fetch(formEl.action, {
                  method: formEl.method,
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(data)
                });
                
                // Procesar la respuesta
                if (response.ok) {
                  const result = await response.json();
                  console.log('Formulario enviado con éxito:', result);
                  
                  // Mostrar mensaje de éxito
                  const successMessage = formEl.querySelector('.form-success-message');
                  if (successMessage) {
                    successMessage.style.display = 'block';
                    
                    // Ocultar después de 5 segundos
                    setTimeout(() => {
                      successMessage.style.display = 'none';
                    }, 5000);
                  }
                  
                  // Resetear el formulario
                  formEl.reset();
                  formEl.classList.remove('was-validated');
                } else {
                  throw new Error('Error en la respuesta del servidor');
                }
              } catch (error) {
                console.error('Error al enviar el formulario:', error);
                
                // Mostrar mensaje de error
                const errorMessage = formEl.querySelector('.form-error-message');
                if (errorMessage) {
                  errorMessage.textContent = `Error: ${error.message}`;
                  errorMessage.style.display = 'block';
                  
                  // Ocultar después de 5 segundos
                  setTimeout(() => {
                    errorMessage.style.display = 'none';
                  }, 5000);
                }
              } finally {
                // Restaurar el botón de envío
                const submitBtn = formEl.querySelector('[type="submit"]');
                if (submitBtn) {
                  submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || 'Enviar';
                  submitBtn.disabled = false;
                }
              }
            });
            
            // Aplicar diseño según la configuración
            if (props.layout) {
              if (props.layout === 'horizontal') {
                formEl.classList.add('row');
                
                const formGroups = formEl.querySelectorAll('.mb-3');
                formGroups.forEach(group => {
                  group.classList.add('row');
                  
                  const label = group.querySelector('label');
                  if (label) {
                    label.classList.add('col-sm-3', 'col-form-label');
                  }
                  
                  const inputWrap = document.createElement('div');
                  inputWrap.className = 'col-sm-9';
                  
                  const input = group.querySelector('input, select, textarea');
                  if (input) {
                    let nextSibling = input.nextSibling;
                    group.insertBefore(inputWrap, input);
                    inputWrap.appendChild(input);
                    
                    // Mover elementos de retroalimentación dentro del contenedor
                    while (nextSibling) {
                      const current = nextSibling;
                      nextSibling = nextSibling.nextSibling;
                      
                      if (current.classList && 
                          (current.classList.contains('invalid-feedback') || 
                           current.classList.contains('valid-feedback'))) {
                        inputWrap.appendChild(current);
                      }
                    }
                  }
                });
              } else if (props.layout === 'inline') {
                formEl.classList.add('row', 'row-cols-lg-auto', 'g-3', 'align-items-center');
              }
            }
            
            // Guardar texto original de los botones
            const buttons = formEl.querySelectorAll('button');
            buttons.forEach(button => {
              button.setAttribute('data-original-text', button.innerHTML);
            });
          }
          
          // Inicializar validación si está habilitada
          if (props.validation) {
            const inputs = formEl.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
              // Solo si no tiene ya los eventos asignados
              if (!input.getAttribute('data-validation-initialized')) {
                input.setAttribute('data-validation-initialized', 'true');
                
                input.addEventListener('blur', function() {
                  if (this.checkValidity()) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                  } else {
                    this.classList.remove('is-valid');
                    this.classList.add('is-invalid');
                  }
                });
                
                input.addEventListener('input', function() {
                  if (this.checkValidity()) {
                    this.classList.remove('is-invalid');
                    this.classList.add('is-valid');
                  }
                });
              }
            });
          }
        }
      }
    },
    view: defaultType.view
  });
  
  // Añadir el bloque para el constructor de formularios
  editor.BlockManager.add('enterprise-form-builder', {
    label: 'Formulario Empresarial',
    category: 'Aplicaciones',
    attributes: { class: 'fa fa-wpforms' },
    content: {
      type: 'enterprise-form-builder',
      content: `
        <form class="needs-validation" novalidate>
          <div class="alert alert-success form-success-message" role="alert" style="display: none;">
            ¡Formulario enviado con éxito!
          </div>
          <div class="alert alert-danger form-error-message" role="alert" style="display: none;">
            Ha ocurrido un error al enviar el formulario.
          </div>
          
          <div class="mb-3">
            <label for="nombre" class="form-label">Nombre</label>
            <input type="text" class="form-control" id="nombre" name="nombre" required>
            <div class="invalid-feedback">
              Por favor ingrese su nombre.
            </div>
          </div>
          
          <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input type="email" class="form-control" id="email" name="email" required>
            <div class="invalid-feedback">
              Por favor ingrese un email válido.
            </div>
          </div>
          
          <div class="mb-3">
            <label for="telefono" class="form-label">Teléfono</label>
            <input type="tel" class="form-control" id="telefono" name="telefono" pattern="[0-9]{9}">
            <div class="invalid-feedback">
              Por favor ingrese un número de teléfono válido.
            </div>
          </div>
          
          <div class="mb-3">
            <label for="empresa" class="form-label">Empresa</label>
            <input type="text" class="form-control" id="empresa" name="empresa">
          </div>
          
          <div class="mb-3">
            <label for="asunto" class="form-label">Asunto</label>
            <select class="form-select" id="asunto" name="asunto" required>
              <option value="">Seleccione una opción</option>
              <option value="consulta">Consulta</option>
              <option value="soporte">Soporte técnico</option>
              <option value="ventas">Ventas</option>
              <option value="otro">Otro</option>
            </select>
            <div class="invalid-feedback">
              Por favor seleccione un asunto.
            </div>
          </div>
          
          <div class="mb-3">
            <label for="mensaje" class="form-label">Mensaje</label>
            <textarea class="form-control" id="mensaje" name="mensaje" rows="4" required></textarea>
            <div class="invalid-feedback">
              Por favor ingrese su mensaje.
            </div>
          </div>
          
          <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="privacidad" name="privacidad" required>
            <label class="form-check-label" for="privacidad">
              Acepto la política de privacidad
            </label>
            <div class="invalid-feedback">
              Debe aceptar la política de privacidad.
            </div>
          </div>
          
          <div class="d-grid gap-2 d-md-flex justify-content-md-end">
            <button type="reset" class="btn btn-outline-secondary me-md-2">Limpiar</button>
            <button type="submit" class="btn btn-primary">Enviar</button>
          </div>
        </form>
      `
    }
  });
} 