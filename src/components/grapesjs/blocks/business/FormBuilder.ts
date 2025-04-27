import { Editor } from 'grapesjs';

export default function(editor: Editor) {
  const domc = editor.DomComponents;
  const defaultType = domc.getType('default');
  const defaultModel = defaultType.model;

  // Registrar el tipo de componente para el formulario avanzado
  domc.addType('business-form-builder', {
    model: {
      defaults: {
        ...defaultModel.prototype.defaults,
        droppable: true,
        attributes: { class: 'business-form-builder' },
        traits: [
          {
            type: 'select',
            name: 'formType',
            label: 'Tipo de formulario',
            options: [
              { id: 'contact', name: 'Contacto' },
              { id: 'register', name: 'Registro' },
              { id: 'payment', name: 'Pago' },
              { id: 'survey', name: 'Encuesta' },
              { id: 'custom', name: 'Personalizado' }
            ]
          },
          {
            type: 'text',
            name: 'submitUrl',
            label: 'URL de envío'
          },
          {
            type: 'checkbox',
            name: 'validation',
            label: 'Validación en cliente'
          },
          {
            type: 'checkbox',
            name: 'responsiveLayout',
            label: 'Diseño responsive'
          },
          {
            type: 'checkbox',
            name: 'showLabels',
            label: 'Mostrar etiquetas'
          },
          {
            type: 'select',
            name: 'labelPosition',
            label: 'Posición de etiquetas',
            options: [
              { id: 'top', name: 'Arriba' },
              { id: 'left', name: 'Izquierda' },
              { id: 'inline', name: 'En línea' }
            ]
          }
        ],
        'script-props': ['formType', 'submitUrl', 'validation', 'responsiveLayout', 'showLabels', 'labelPosition'],
        script() {
          const props = this.props;
          const formEl = this.el;
          
          // Configurar el formulario según el tipo seleccionado
          const setupForm = () => {
            const formType = props.formType || 'contact';
            const formFields = formEl.querySelector('.form-fields');
            
            if (!formFields) return;
            
            // Aplicar clases responsive si está habilitado
            if (props.responsiveLayout) {
              formFields.classList.add('responsive-form');
            } else {
              formFields.classList.remove('responsive-form');
            }
            
            // Configurar posición de las etiquetas
            const labelPosition = props.labelPosition || 'top';
            formFields.setAttribute('data-label-position', labelPosition);
            
            // Mostrar u ocultar etiquetas
            const showLabels = props.showLabels !== false;
            formFields.querySelectorAll('label').forEach(label => {
              label.style.display = showLabels ? '' : 'none';
            });
            
            // Configurar validación del formulario
            if (props.validation) {
              enableFormValidation();
            }
          };
          
          // Función para habilitar la validación del formulario
          const enableFormValidation = () => {
            const form = formEl.querySelector('form');
            if (!form) return;
            
            // Validar formulario al enviar
            form.onsubmit = (event) => {
              let isValid = true;
              const errorMessages = formEl.querySelectorAll('.invalid-feedback');
              
              // Resetear mensajes de error
              errorMessages.forEach(el => {
                el.style.display = 'none';
              });
              
              // Validar campos requeridos
              const requiredFields = form.querySelectorAll('[required]');
              requiredFields.forEach(field => {
                if (!(field as HTMLInputElement).value.trim()) {
                  isValid = false;
                  field.classList.add('is-invalid');
                  const feedback = field.parentNode.querySelector('.invalid-feedback');
                  if (feedback) {
                    feedback.style.display = 'block';
                  }
                } else {
                  field.classList.remove('is-invalid');
                }
              });
              
              // Validar emails
              const emailFields = form.querySelectorAll('[type="email"]');
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              emailFields.forEach(field => {
                const value = (field as HTMLInputElement).value.trim();
                if (value && !emailRegex.test(value)) {
                  isValid = false;
                  field.classList.add('is-invalid');
                  const feedback = field.parentNode.querySelector('.invalid-feedback');
                  if (feedback) {
                    feedback.style.display = 'block';
                    feedback.textContent = 'Por favor ingrese un email válido';
                  }
                }
              });
              
              // Si tiene URL de envío y es válido, permitir el envío normal
              if (isValid && props.submitUrl) {
                form.action = props.submitUrl;
                return true;
              }
              
              // Si no hay URL o no es válido, prevenir el envío
              event.preventDefault();
              
              // Mostrar mensaje de éxito si es válido (simulación)
              if (isValid) {
                const successAlert = formEl.querySelector('.form-success-message');
                if (successAlert) {
                  successAlert.style.display = 'block';
                  // Ocultar mensaje después de 5 segundos
                  setTimeout(() => {
                    successAlert.style.display = 'none';
                  }, 5000);
                }
                // Limpiar formulario
                form.reset();
              }
              
              return false;
            };
            
            // Validación en tiempo real
            const inputFields = form.querySelectorAll('input, textarea, select');
            inputFields.forEach(field => {
              field.addEventListener('blur', () => {
                validateField(field as HTMLInputElement);
              });
              
              field.addEventListener('input', () => {
                if (field.classList.contains('is-invalid')) {
                  validateField(field as HTMLInputElement);
                }
              });
            });
          };
          
          // Validar campo individual
          const validateField = (field) => {
            if (field.hasAttribute('required') && !field.value.trim()) {
              field.classList.add('is-invalid');
              const feedback = field.parentNode.querySelector('.invalid-feedback');
              if (feedback) {
                feedback.style.display = 'block';
              }
            } else if (field.type === 'email') {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (field.value.trim() && !emailRegex.test(field.value.trim())) {
                field.classList.add('is-invalid');
                const feedback = field.parentNode.querySelector('.invalid-feedback');
                if (feedback) {
                  feedback.style.display = 'block';
                  feedback.textContent = 'Por favor ingrese un email válido';
                }
              } else {
                field.classList.remove('is-invalid');
              }
            } else {
              field.classList.remove('is-invalid');
            }
          };
          
          // Inicializar el formulario
          setupForm();
          
          // Configurar CSS para diferentes posiciones de etiquetas
          const style = document.createElement('style');
          style.textContent = `
            .business-form-builder .responsive-form {
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
            }
            
            .business-form-builder .responsive-form .form-group {
              flex: 1 0 100%;
            }
            
            @media (min-width: 768px) {
              .business-form-builder .responsive-form .form-group {
                flex: 1 0 45%;
              }
              
              .business-form-builder .responsive-form .form-group.full-width {
                flex: 1 0 100%;
              }
            }
            
            .business-form-builder .form-fields[data-label-position="left"] .form-group {
              display: flex;
              align-items: center;
            }
            
            .business-form-builder .form-fields[data-label-position="left"] label {
              width: 30%;
              margin-bottom: 0;
              padding-right: 1rem;
            }
            
            .business-form-builder .form-fields[data-label-position="left"] .input-wrapper {
              width: 70%;
            }
            
            .business-form-builder .form-fields[data-label-position="inline"] .form-group {
              position: relative;
            }
            
            .business-form-builder .form-fields[data-label-position="inline"] label {
              position: absolute;
              left: 1rem;
              top: 0.5rem;
              font-size: 0.75rem;
              opacity: 0.7;
            }
            
            .business-form-builder .form-fields[data-label-position="inline"] input,
            .business-form-builder .form-fields[data-label-position="inline"] textarea,
            .business-form-builder .form-fields[data-label-position="inline"] select {
              padding-top: 1.5rem;
            }
          `;
          document.head.appendChild(style);
        }
      }
    },
    view: defaultType.view
  });

  // Añadir el bloque para el formulario
  editor.BlockManager.add('business-form-builder', {
    label: 'Formulario Avanzado',
    category: 'Negocios',
    attributes: { class: 'fa fa-wpforms' },
    content: {
      type: 'business-form-builder',
      content: `
        <div class="card border mb-4">
          <div class="card-header bg-light">
            <h5 class="mb-0">Formulario de Contacto</h5>
          </div>
          <div class="card-body">
            <div class="form-success-message alert alert-success" style="display: none;">
              ¡Formulario enviado correctamente! Nos pondremos en contacto pronto.
            </div>
            
            <form method="post">
              <div class="form-fields">
                <div class="form-group mb-3">
                  <label for="name" class="form-label">Nombre</label>
                  <div class="input-wrapper">
                    <input type="text" class="form-control" id="name" name="name" required>
                    <div class="invalid-feedback">Por favor ingrese su nombre</div>
                  </div>
                </div>
                
                <div class="form-group mb-3">
                  <label for="email" class="form-label">Email</label>
                  <div class="input-wrapper">
                    <input type="email" class="form-control" id="email" name="email" required>
                    <div class="invalid-feedback">Por favor ingrese un email válido</div>
                  </div>
                </div>
                
                <div class="form-group mb-3">
                  <label for="phone" class="form-label">Teléfono</label>
                  <div class="input-wrapper">
                    <input type="tel" class="form-control" id="phone" name="phone">
                    <div class="invalid-feedback">Por favor ingrese un teléfono válido</div>
                  </div>
                </div>
                
                <div class="form-group mb-3">
                  <label for="subject" class="form-label">Asunto</label>
                  <div class="input-wrapper">
                    <select class="form-select" id="subject" name="subject">
                      <option value="info">Información</option>
                      <option value="support">Soporte</option>
                      <option value="sales">Ventas</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                </div>
                
                <div class="form-group full-width mb-3">
                  <label for="message" class="form-label">Mensaje</label>
                  <div class="input-wrapper">
                    <textarea class="form-control" id="message" name="message" rows="4" required></textarea>
                    <div class="invalid-feedback">Por favor ingrese su mensaje</div>
                  </div>
                </div>
                
                <div class="form-group full-width mb-3">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="privacy" name="privacy" required>
                    <label class="form-check-label" for="privacy">
                      Acepto la política de privacidad
                    </label>
                    <div class="invalid-feedback">Debe aceptar la política de privacidad</div>
                  </div>
                </div>
              </div>
              
              <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                <button type="reset" class="btn btn-outline-secondary me-md-2">Cancelar</button>
                <button type="submit" class="btn btn-primary">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      `
    }
  });
} 