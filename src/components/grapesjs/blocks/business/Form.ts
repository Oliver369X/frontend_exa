import { Editor } from 'grapesjs';

/**
 * Componente de formulario empresarial para GrapesJS
 */
export default (editor: Editor) => {
  const domc = editor.DomComponents;
  
  // Registrar el componente de formulario
  domc.addType('business-form', {
    isComponent: (el) => el.tagName === 'FORM' && el.classList.contains('business-form'),
    model: {
      defaults: {
        tagName: 'form',
        attributes: { class: 'business-form' },
        droppable: true,
        draggable: true,
        // Propiedades del componente
        traits: [
          {
            type: 'select',
            name: 'submitAction',
            label: 'Acción al enviar',
            options: [
              { id: 'api', name: 'Enviar a API' },
              { id: 'email', name: 'Enviar por email' },
              { id: 'local', name: 'Guardar localmente' }
            ],
            default: 'api'
          },
          {
            type: 'text',
            name: 'apiEndpoint',
            label: 'URL de API'
          },
          {
            type: 'text',
            name: 'successMessage',
            label: 'Mensaje de éxito'
          },
          {
            type: 'text',
            name: 'errorMessage',
            label: 'Mensaje de error'
          },
          {
            type: 'checkbox',
            name: 'enableValidation',
            label: 'Habilitar validación'
          },
          {
            type: 'checkbox',
            name: 'enableReCaptcha',
            label: 'Habilitar ReCaptcha'
          },
          {
            type: 'text',
            name: 'redirectURL',
            label: 'URL de redirección'
          }
        ],
        // Script para inicializar el componente en el navegador
        script: function() {
          const el = this as HTMLFormElement;
          const options = {
            submitAction: el.getAttribute('data-submit-action') || 'api',
            apiEndpoint: el.getAttribute('data-api-endpoint') || '',
            successMessage: el.getAttribute('data-success-message') || 'Formulario enviado correctamente',
            errorMessage: el.getAttribute('data-error-message') || 'Error al enviar el formulario',
            enableValidation: el.getAttribute('data-enable-validation') === 'true',
            enableReCaptcha: el.getAttribute('data-enable-recaptcha') === 'true',
            redirectURL: el.getAttribute('data-redirect-url') || ''
          };
          
          // Inicializar formulario
          function initForm() {
            // Añadir clases de Bootstrap si no existen
            el.classList.add('needs-validation');
            if (options.enableValidation) {
              el.setAttribute('novalidate', '');
            }
            
            // Procesar todos los campos del formulario
            const inputs = el.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
              // Añadir clases si no existen
              if (!input.classList.contains('form-control') && 
                  input.type !== 'checkbox' && 
                  input.type !== 'radio' && 
                  input.type !== 'submit' &&
                  input.type !== 'file') {
                input.classList.add('form-control');
              }
              
              if (input.type === 'checkbox' || input.type === 'radio') {
                input.classList.add('form-check-input');
                // Envolver checkboxes y radios en div si no lo están
                const parent = input.parentElement;
                if (parent && parent.tagName !== 'DIV') {
                  const wrapper = document.createElement('div');
                  wrapper.classList.add('form-check');
                  
                  // Obtener la etiqueta asociada
                  let label = null;
                  const id = input.id;
                  if (id) {
                    label = el.querySelector(`label[for="${id}"]`);
                  }
                  
                  // Mover a wrapper
                  const clone = input.cloneNode(true) as HTMLElement;
                  parent.insertBefore(wrapper, input);
                  wrapper.appendChild(clone);
                  if (label) {
                    wrapper.appendChild(label);
                    label.classList.add('form-check-label');
                  }
                  parent.removeChild(input);
                }
              }
              
              if (input.type === 'file') {
                input.classList.add('form-control-file');
              }
              
              if (input.type === 'submit') {
                input.classList.add('btn', 'btn-primary');
              }
              
              // Agregar validación HTML5
              if (options.enableValidation && input.hasAttribute('required')) {
                input.classList.add('required-field');
                
                // Añadir feedback de validación
                const parent = input.parentElement;
                if (parent) {
                  let feedback = parent.querySelector('.invalid-feedback');
                  if (!feedback) {
                    feedback = document.createElement('div');
                    feedback.classList.add('invalid-feedback');
                    feedback.textContent = 'Este campo es obligatorio';
                    parent.appendChild(feedback);
                  }
                }
              }
            });
            
            // Estilizar etiquetas de formulario
            const labels = el.querySelectorAll('label:not(.form-check-label)');
            labels.forEach(label => {
              if (!label.classList.contains('form-label')) {
                label.classList.add('form-label');
              }
            });
            
            // Estilizar grupos de formulario
            const formGroups = el.querySelectorAll('.form-group');
            formGroups.forEach(group => {
              if (group.classList.contains('form-row')) return;
              group.classList.add('mb-3');
            });
            
            // Añadir ReCaptcha si está habilitado
            if (options.enableReCaptcha) {
              let recaptchaContainer = el.querySelector('.g-recaptcha');
              if (!recaptchaContainer) {
                recaptchaContainer = document.createElement('div');
                recaptchaContainer.classList.add('g-recaptcha', 'mb-3');
                recaptchaContainer.setAttribute('data-sitekey', 'YOUR_RECAPTCHA_SITE_KEY');
                
                // Insertar antes del botón de envío
                const submitButton = el.querySelector('input[type="submit"], button[type="submit"]');
                if (submitButton) {
                  el.insertBefore(recaptchaContainer, submitButton);
                } else {
                  el.appendChild(recaptchaContainer);
                }
                
                // Cargar el script de ReCaptcha si no está cargado
                if (!document.querySelector('script[src*="recaptcha"]')) {
                  const script = document.createElement('script');
                  script.src = 'https://www.google.com/recaptcha/api.js';
                  script.async = true;
                  script.defer = true;
                  document.head.appendChild(script);
                }
              }
            }
            
            // Preparar contenedor para mensajes de respuesta
            let responseContainer = el.querySelector('.form-response');
            if (!responseContainer) {
              responseContainer = document.createElement('div');
              responseContainer.classList.add('form-response', 'mt-3');
              el.appendChild(responseContainer);
            }
          }
          
          // Manejar envío del formulario
          function handleSubmit(e) {
            e.preventDefault();
            
            // Obtener el contenedor de respuesta
            const responseContainer = el.querySelector('.form-response');
            
            // Verificar validación HTML5
            if (options.enableValidation) {
              el.classList.add('was-validated');
              if (!el.checkValidity()) {
                return false;
              }
            }
            
            // Serializar datos del formulario
            const formData = new FormData(el);
            const data = {};
            formData.forEach((value, key) => {
              data[key] = value;
            });
            
            // Mostrar estado de carga
            if (responseContainer) {
              responseContainer.innerHTML = '<div class="alert alert-info">Enviando formulario...</div>';
            }
            
            // Procesamiento según la acción seleccionada
            switch (options.submitAction) {
              case 'api':
                if (!options.apiEndpoint) {
                  showResponse('error', 'No se ha configurado la URL de la API');
                  return;
                }
                
                fetch(options.apiEndpoint, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(data)
                })
                .then(response => {
                  if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                  }
                  return response.json();
                })
                .then(responseData => {
                  showResponse('success', options.successMessage);
                  if (options.redirectURL) {
                    setTimeout(() => {
                      window.location.href = options.redirectURL;
                    }, 2000);
                  }
                })
                .catch(error => {
                  showResponse('error', options.errorMessage + ': ' + error.message);
                });
                break;
                
              case 'email':
                // Simulación de envío por email (en una aplicación real usaría un servicio)
                setTimeout(() => {
                  showResponse('success', 'Formulario enviado a correo electrónico (simulado)');
                  if (options.redirectURL) {
                    setTimeout(() => {
                      window.location.href = options.redirectURL;
                    }, 2000);
                  }
                }, 1000);
                break;
                
              case 'local':
                // Guardar en localStorage
                try {
                  const storedData = localStorage.getItem('businessFormData');
                  const formEntries = storedData ? JSON.parse(storedData) : [];
                  
                  // Añadir nueva entrada con timestamp
                  data['timestamp'] = new Date().toISOString();
                  formEntries.push(data);
                  
                  localStorage.setItem('businessFormData', JSON.stringify(formEntries));
                  showResponse('success', 'Datos guardados localmente');
                  
                  if (options.redirectURL) {
                    setTimeout(() => {
                      window.location.href = options.redirectURL;
                    }, 2000);
                  }
                } catch (error) {
                  showResponse('error', 'Error al guardar datos: ' + error.message);
                }
                break;
            }
          }
          
          // Mostrar mensaje de respuesta
          function showResponse(type, message) {
            const responseContainer = el.querySelector('.form-response');
            if (!responseContainer) return;
            
            let alertClass = 'alert-info';
            if (type === 'success') alertClass = 'alert-success';
            if (type === 'error') alertClass = 'alert-danger';
            
            responseContainer.innerHTML = `<div class="alert ${alertClass}">${message}</div>`;
            
            // Resetear el formulario en caso de éxito
            if (type === 'success') {
              el.reset();
              el.classList.remove('was-validated');
            }
          }
          
          // Inicializar
          initForm();
          
          // Agregar manejador de eventos
          el.addEventListener('submit', handleSubmit);
        },
        
        // Estilos específicos del componente
        style: `
          .business-form {
            padding: 1.5rem;
            border-radius: 0.3rem;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            max-width: 800px;
            margin: 0 auto;
          }
          
          .business-form .form-title {
            margin-bottom: 1.5rem;
            border-bottom: 1px solid #dee2e6;
            padding-bottom: 1rem;
            font-size: 1.5rem;
            font-weight: 600;
          }
          
          .business-form .form-subtitle {
            margin-bottom: 1.2rem;
            font-size: 1.1rem;
            color: #6c757d;
          }
          
          .business-form .required-field::after {
            content: ' *';
            color: #dc3545;
          }
          
          .business-form .form-response {
            margin-top: 1rem;
          }
          
          .business-form .btn-submit {
            min-width: 120px;
          }
          
          /* Estilos de validación */
          .business-form.was-validated .form-control:invalid {
            border-color: #dc3545;
            padding-right: calc(1.5em + 0.75rem);
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%23dc3545' viewBox='0 0 12 12'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath stroke-linejoin='round' d='M5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right calc(0.375em + 0.1875rem) center;
            background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
          }
          
          .business-form.was-validated .form-control:valid {
            border-color: #28a745;
            padding-right: calc(1.5em + 0.75rem);
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3e%3cpath fill='%2328a745' d='M2.3 6.73L.6 4.53c-.4-1.04.46-1.4 1.1-.8l1.1 1.4 3.4-3.8c.6-.63 1.6-.27 1.2.7l-4 4.6c-.43.5-.8.4-1.1.1z'/%3e%3c/svg%3e");
            background-repeat: no-repeat;
            background-position: right calc(0.375em + 0.1875rem) center;
            background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
          }
        `
      }
    }
  });
  
  // Añadir bloques al BlockManager
  editor.BlockManager.add('business-form-contact', {
    label: 'Formulario de Contacto',
    category: 'Negocios',
    content: {
      type: 'business-form',
      attributes: {
        'data-submit-action': 'api',
        'data-api-endpoint': '/api/contact',
        'data-success-message': 'Gracias por contactarnos. Pronto nos comunicaremos contigo.',
        'data-error-message': 'Hubo un error al enviar el formulario. Por favor, inténtalo nuevamente.',
        'data-enable-validation': 'true'
      },
      components: `
        <div class="form-title">Contáctenos</div>
        <div class="form-subtitle">Complete el formulario y nos pondremos en contacto con usted lo antes posible.</div>
        
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="contact-name">Nombre</label>
              <input type="text" class="form-control" id="contact-name" name="name" required>
              <div class="invalid-feedback">Por favor ingrese su nombre</div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="contact-email">Email</label>
              <input type="email" class="form-control" id="contact-email" name="email" required>
              <div class="invalid-feedback">Por favor ingrese un email válido</div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="contact-subject">Asunto</label>
          <input type="text" class="form-control" id="contact-subject" name="subject">
        </div>
        
        <div class="form-group">
          <label for="contact-message">Mensaje</label>
          <textarea class="form-control" id="contact-message" name="message" rows="5" required></textarea>
          <div class="invalid-feedback">Por favor ingrese su mensaje</div>
        </div>
        
        <div class="form-group form-check">
          <input type="checkbox" class="form-check-input" id="contact-terms" name="terms" required>
          <label class="form-check-label" for="contact-terms">Acepto los términos y condiciones</label>
          <div class="invalid-feedback">Debe aceptar los términos para continuar</div>
        </div>
        
        <button type="submit" class="btn btn-primary btn-submit">Enviar Mensaje</button>
      `
    }
  });
  
  editor.BlockManager.add('business-form-registration', {
    label: 'Formulario de Registro',
    category: 'Negocios',
    content: {
      type: 'business-form',
      attributes: {
        'data-submit-action': 'api',
        'data-api-endpoint': '/api/register',
        'data-success-message': 'Registro completado con éxito. Recibirás un email de confirmación.',
        'data-error-message': 'Error al procesar el registro. Por favor, inténtalo nuevamente.',
        'data-enable-validation': 'true',
        'data-enable-recaptcha': 'true'
      },
      components: `
        <div class="form-title">Crear una cuenta</div>
        <div class="form-subtitle">Complete el formulario para registrarse en nuestra plataforma.</div>
        
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="reg-firstname">Nombre</label>
              <input type="text" class="form-control" id="reg-firstname" name="firstName" required>
              <div class="invalid-feedback">Por favor ingrese su nombre</div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="reg-lastname">Apellido</label>
              <input type="text" class="form-control" id="reg-lastname" name="lastName" required>
              <div class="invalid-feedback">Por favor ingrese su apellido</div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="reg-email">Email</label>
          <input type="email" class="form-control" id="reg-email" name="email" required>
          <div class="invalid-feedback">Por favor ingrese un email válido</div>
        </div>
        
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="reg-password">Contraseña</label>
              <input type="password" class="form-control" id="reg-password" name="password" required 
                     pattern=".{8,}" title="La contraseña debe tener al menos 8 caracteres">
              <div class="invalid-feedback">La contraseña debe tener al menos 8 caracteres</div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="form-group">
              <label for="reg-password-confirm">Confirmar Contraseña</label>
              <input type="password" class="form-control" id="reg-password-confirm" name="passwordConfirm" required>
              <div class="invalid-feedback">Las contraseñas deben coincidir</div>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="reg-company">Empresa (opcional)</label>
          <input type="text" class="form-control" id="reg-company" name="company">
        </div>
        
        <div class="form-group">
          <label for="reg-country">País</label>
          <select class="form-control" id="reg-country" name="country" required>
            <option value="">Seleccione un país</option>
            <option value="AR">Argentina</option>
            <option value="BO">Bolivia</option>
            <option value="CL">Chile</option>
            <option value="CO">Colombia</option>
            <option value="CR">Costa Rica</option>
            <option value="CU">Cuba</option>
            <option value="DO">República Dominicana</option>
            <option value="EC">Ecuador</option>
            <option value="SV">El Salvador</option>
            <option value="GT">Guatemala</option>
            <option value="HN">Honduras</option>
            <option value="MX">México</option>
            <option value="NI">Nicaragua</option>
            <option value="PA">Panamá</option>
            <option value="PY">Paraguay</option>
            <option value="PE">Perú</option>
            <option value="PR">Puerto Rico</option>
            <option value="ES">España</option>
            <option value="UY">Uruguay</option>
            <option value="VE">Venezuela</option>
          </select>
          <div class="invalid-feedback">Por favor seleccione un país</div>
        </div>
        
        <div class="form-group form-check">
          <input type="checkbox" class="form-check-input" id="reg-newsletter" name="newsletter">
          <label class="form-check-label" for="reg-newsletter">Suscribirse al boletín de noticias</label>
        </div>
        
        <div class="form-group form-check">
          <input type="checkbox" class="form-check-input" id="reg-terms" name="terms" required>
          <label class="form-check-label" for="reg-terms">Acepto los términos y condiciones y la política de privacidad</label>
          <div class="invalid-feedback">Debe aceptar los términos para continuar</div>
        </div>
        
        <button type="submit" class="btn btn-primary btn-submit">Registrarse</button>
      `
    }
  });
  
  console.log('Componente de formulario empresarial registrado');
}; 