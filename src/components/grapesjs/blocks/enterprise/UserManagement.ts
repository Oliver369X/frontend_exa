import { Editor } from 'grapesjs';

export default function (editor: Editor) {
  const domc = editor.DomComponents;
  const defaultType = domc.getType('default');
  const defaultModel = defaultType.model;

  // Registrar el tipo de componente para gestión de usuarios
  domc.addType('enterprise-user-management', {
    model: {
      defaults: {
        ...defaultModel.prototype.defaults,
        droppable: true,
        attributes: { class: 'enterprise-user-management' },
        traits: [
          {
            type: 'select',
            name: 'dataSource',
            label: 'Fuente de datos',
            options: [
              { id: 'static', name: 'Datos estáticos' },
              { id: 'api', name: 'API REST' }
            ]
          },
          {
            type: 'text',
            name: 'apiEndpoint',
            label: 'URL API'
          },
          {
            type: 'checkbox',
            name: 'enableCreate',
            label: 'Permitir crear'
          },
          {
            type: 'checkbox',
            name: 'enableEdit',
            label: 'Permitir editar'
          },
          {
            type: 'checkbox',
            name: 'enableDelete',
            label: 'Permitir eliminar'
          }
        ],
        'script-props': ['dataSource', 'apiEndpoint', 'enableCreate', 'enableEdit', 'enableDelete'],
        script() {
          const props = this.props;
          const container = this.el;
          let currentUsers = [];
          let editingUserId = null;
          
          // Definir los roles disponibles
          const availableRoles = [
            { id: 'admin', name: 'Administrador' },
            { id: 'manager', name: 'Gestor' },
            { id: 'user', name: 'Usuario' },
            { id: 'guest', name: 'Invitado' }
          ];
          
          // Inicializar manejadores de eventos
          function initEventListeners() {
            // Botón para abrir modal de crear usuario
            const createBtn = container.querySelector('.btn-create-user');
            if (createBtn && props.enableCreate) {
              createBtn.addEventListener('click', showCreateUserModal);
            } else if (createBtn) {
              createBtn.style.display = 'none';
            }
            
            // Botón de búsqueda
            const searchInput = container.querySelector('.user-search-input');
            if (searchInput) {
              searchInput.addEventListener('input', handleSearch);
            }
            
            // Botones para cerrar modales
            container.querySelectorAll('.modal .btn-close, .modal .btn-cancel').forEach(btn => {
              btn.addEventListener('click', closeModals);
            });
            
            // Formularios
            const createForm = container.querySelector('#user-create-form');
            if (createForm) {
              createForm.addEventListener('submit', handleCreateUser);
            }
            
            const editForm = container.querySelector('#user-edit-form');
            if (editForm) {
              editForm.addEventListener('submit', handleEditUser);
            }
          }
          
          // Cargar los datos de usuarios
          async function loadUsers() {
            try {
              showLoader();
              let users = [];
              
              if (props.dataSource === 'api' && props.apiEndpoint) {
                try {
                  const response = await fetch(props.apiEndpoint);
                  if (!response.ok) throw new Error('Error al cargar usuarios');
                  users = await response.json();
                } catch (error) {
                  console.error('Error cargando usuarios desde API:', error);
                  showError(`Error: ${error.message}`);
                  users = getSampleUsers(); // Usar datos de muestra como fallback
                }
              } else {
                users = getSampleUsers();
              }
              
              currentUsers = users;
              renderUserTable(users);
              
            } catch (error) {
              console.error('Error en carga de usuarios:', error);
              showError(`Error: ${error.message}`);
            } finally {
              hideLoader();
            }
          }
          
          // Obtener datos de muestra
          function getSampleUsers() {
            return [
              { id: 1, name: 'Ana Martínez', email: 'ana.martinez@ejemplo.com', role: 'admin', status: 'active', lastLogin: '2023-11-22T10:30:00' },
              { id: 2, name: 'Carlos López', email: 'carlos.lopez@ejemplo.com', role: 'manager', status: 'active', lastLogin: '2023-11-21T14:45:00' },
              { id: 3, name: 'Elena García', email: 'elena.garcia@ejemplo.com', role: 'user', status: 'active', lastLogin: '2023-11-20T09:15:00' },
              { id: 4, name: 'Pablo Rodríguez', email: 'pablo.rodriguez@ejemplo.com', role: 'user', status: 'inactive', lastLogin: '2023-10-05T16:20:00' },
              { id: 5, name: 'Laura Sánchez', email: 'laura.sanchez@ejemplo.com', role: 'guest', status: 'pending', lastLogin: null },
              { id: 6, name: 'Miguel Torres', email: 'miguel.torres@ejemplo.com', role: 'manager', status: 'active', lastLogin: '2023-11-18T11:10:00' },
              { id: 7, name: 'Isabel Navarro', email: 'isabel.navarro@ejemplo.com', role: 'user', status: 'active', lastLogin: '2023-11-19T13:25:00' },
              { id: 8, name: 'Javier Ruiz', email: 'javier.ruiz@ejemplo.com', role: 'user', status: 'blocked', lastLogin: '2023-09-30T08:45:00' }
            ];
          }
          
          // Renderizar tabla de usuarios
          function renderUserTable(users) {
            const tableBody = container.querySelector('.user-table tbody');
            if (!tableBody) return;
            
            tableBody.innerHTML = '';
            
            if (users.length === 0) {
              tableBody.innerHTML = `
                <tr>
                  <td colspan="6" class="text-center">No se encontraron usuarios</td>
                </tr>
              `;
              return;
            }
            
            users.forEach(user => {
              const row = document.createElement('tr');
              
              // Status badge class
              let statusClass = 'bg-success';
              let statusText = 'Activo';
              
              if (user.status === 'inactive') {
                statusClass = 'bg-secondary';
                statusText = 'Inactivo';
              } else if (user.status === 'pending') {
                statusClass = 'bg-warning';
                statusText = 'Pendiente';
              } else if (user.status === 'blocked') {
                statusClass = 'bg-danger';
                statusText = 'Bloqueado';
              }
              
              // Role text
              let roleText = user.role;
              const roleObj = availableRoles.find(r => r.id === user.role);
              if (roleObj) {
                roleText = roleObj.name;
              }
              
              // Format date
              let lastLoginText = 'Nunca';
              if (user.lastLogin) {
                const date = new Date(user.lastLogin);
                lastLoginText = date.toLocaleString();
              }
              
              row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${roleText}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td>${lastLoginText}</td>
                <td>
                  <div class="btn-group btn-group-sm" role="group">
                    ${props.enableEdit ? `<button type="button" class="btn btn-outline-primary btn-edit" data-id="${user.id}">
                      <i class="fas fa-edit"></i>
                    </button>` : ''}
                    ${props.enableDelete ? `<button type="button" class="btn btn-outline-danger btn-delete" data-id="${user.id}">
                      <i class="fas fa-trash-alt"></i>
                    </button>` : ''}
                  </div>
                </td>
              `;
              
              tableBody.appendChild(row);
            });
            
            // Añadir manejadores de eventos a botones de acción
            if (props.enableEdit) {
              tableBody.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', function() {
                  const userId = parseInt(this.getAttribute('data-id'), 10);
                  showEditUserModal(userId);
                });
              });
            }
            
            if (props.enableDelete) {
              tableBody.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', function() {
                  const userId = parseInt(this.getAttribute('data-id'), 10);
                  showDeleteUserConfirmation(userId);
                });
              });
            }
          }
          
          // Buscar usuarios
          function handleSearch(event) {
            const searchText = event.target.value.toLowerCase();
            if (!searchText) {
              renderUserTable(currentUsers);
              return;
            }
            
            const filteredUsers = currentUsers.filter(user => 
              user.name.toLowerCase().includes(searchText) || 
              user.email.toLowerCase().includes(searchText) ||
              user.role.toLowerCase().includes(searchText)
            );
            
            renderUserTable(filteredUsers);
          }
          
          // Mostrar modal de creación de usuario
          function showCreateUserModal() {
            // Rellenar select de roles
            const roleSelect = container.querySelector('#new-user-role');
            if (roleSelect) {
              roleSelect.innerHTML = availableRoles.map(role => 
                `<option value="${role.id}">${role.name}</option>`
              ).join('');
            }
            
            // Mostrar modal
            const modal = container.querySelector('#create-user-modal');
            if (modal) {
              modal.style.display = 'block';
              modal.classList.add('show');
              
              // Focus primer campo
              setTimeout(() => {
                const nameInput = container.querySelector('#new-user-name');
                if (nameInput) nameInput.focus();
              }, 100);
            }
          }
          
          // Mostrar modal de edición de usuario
          function showEditUserModal(userId) {
            const user = currentUsers.find(u => u.id === userId);
            if (!user) return;
            
            editingUserId = userId;
            
            // Rellenar el formulario
            const nameInput = container.querySelector('#edit-user-name');
            const emailInput = container.querySelector('#edit-user-email');
            const roleSelect = container.querySelector('#edit-user-role');
            const statusSelect = container.querySelector('#edit-user-status');
            
            if (nameInput) nameInput.value = user.name;
            if (emailInput) emailInput.value = user.email;
            
            // Rellenar roles
            if (roleSelect) {
              roleSelect.innerHTML = availableRoles.map(role => 
                `<option value="${role.id}" ${role.id === user.role ? 'selected' : ''}>${role.name}</option>`
              ).join('');
            }
            
            // Rellenar estados
            if (statusSelect) {
              const statusOptions = [
                { id: 'active', name: 'Activo' },
                { id: 'inactive', name: 'Inactivo' },
                { id: 'pending', name: 'Pendiente' },
                { id: 'blocked', name: 'Bloqueado' }
              ];
              
              statusSelect.innerHTML = statusOptions.map(status => 
                `<option value="${status.id}" ${status.id === user.status ? 'selected' : ''}>${status.name}</option>`
              ).join('');
            }
            
            // Mostrar modal
            const modal = container.querySelector('#edit-user-modal');
            if (modal) {
              modal.style.display = 'block';
              modal.classList.add('show');
              
              // Focus primer campo
              setTimeout(() => {
                if (nameInput) nameInput.focus();
              }, 100);
            }
          }
          
          // Mostrar confirmación de eliminación
          function showDeleteUserConfirmation(userId) {
            const user = currentUsers.find(u => u.id === userId);
            if (!user) return;
            
            const confirmModal = container.querySelector('#delete-user-modal');
            const confirmText = container.querySelector('#delete-user-text');
            
            if (confirmText) {
              confirmText.textContent = `¿Está seguro que desea eliminar al usuario "${user.name}"?`;
            }
            
            if (confirmModal) {
              confirmModal.style.display = 'block';
              confirmModal.classList.add('show');
              
              // Configurar botón de confirmación
              const confirmBtn = confirmModal.querySelector('.btn-confirm-delete');
              if (confirmBtn) {
                // Eliminar listeners previos
                const newConfirmBtn = confirmBtn.cloneNode(true);
                confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
                
                // Agregar listener
                newConfirmBtn.addEventListener('click', function() {
                  deleteUser(userId);
                  closeModals();
                });
              }
            }
          }
          
          // Crear nuevo usuario
          function handleCreateUser(event) {
            event.preventDefault();
            
            const nameInput = container.querySelector('#new-user-name');
            const emailInput = container.querySelector('#new-user-email');
            const roleSelect = container.querySelector('#new-user-role');
            const passwordInput = container.querySelector('#new-user-password');
            
            if (!nameInput || !emailInput || !roleSelect || !passwordInput) return;
            
            // Validación simple
            if (!nameInput.value || !emailInput.value || !passwordInput.value) {
              showError('Todos los campos son obligatorios');
              return;
            }
            
            const newUser = {
              id: currentUsers.length > 0 ? Math.max(...currentUsers.map(u => u.id)) + 1 : 1,
              name: nameInput.value,
              email: emailInput.value,
              role: roleSelect.value,
              status: 'active',
              lastLogin: null
            };
            
            // Si estamos conectados a una API, intentaríamos crear el usuario
            if (props.dataSource === 'api' && props.apiEndpoint) {
              showLoader();
              
              // Simulación de API call
              setTimeout(() => {
                currentUsers.push(newUser);
                renderUserTable(currentUsers);
                closeModals();
                showSuccess('Usuario creado correctamente');
                hideLoader();
                
                // Reset form
                nameInput.value = '';
                emailInput.value = '';
                passwordInput.value = '';
              }, 1000);
            } else {
              // Agregar directamente a los datos locales
              currentUsers.push(newUser);
              renderUserTable(currentUsers);
              closeModals();
              showSuccess('Usuario creado correctamente');
              
              // Reset form
              nameInput.value = '';
              emailInput.value = '';
              passwordInput.value = '';
            }
          }
          
          // Editar usuario existente
          function handleEditUser(event) {
            event.preventDefault();
            
            if (editingUserId === null) return;
            
            const nameInput = container.querySelector('#edit-user-name');
            const emailInput = container.querySelector('#edit-user-email');
            const roleSelect = container.querySelector('#edit-user-role');
            const statusSelect = container.querySelector('#edit-user-status');
            
            if (!nameInput || !emailInput || !roleSelect || !statusSelect) return;
            
            // Validación simple
            if (!nameInput.value || !emailInput.value) {
              showError('Nombre y email son obligatorios');
              return;
            }
            
            // Encontrar el índice del usuario
            const userIndex = currentUsers.findIndex(u => u.id === editingUserId);
            if (userIndex === -1) return;
            
            // Actualizar datos
            const updatedUser = {
              ...currentUsers[userIndex],
              name: nameInput.value,
              email: emailInput.value,
              role: roleSelect.value,
              status: statusSelect.value
            };
            
            // Si estamos conectados a una API, intentaríamos actualizar el usuario
            if (props.dataSource === 'api' && props.apiEndpoint) {
              showLoader();
              
              // Simulación de API call
              setTimeout(() => {
                currentUsers[userIndex] = updatedUser;
                renderUserTable(currentUsers);
                closeModals();
                showSuccess('Usuario actualizado correctamente');
                hideLoader();
                editingUserId = null;
              }, 1000);
            } else {
              // Actualizar directamente en los datos locales
              currentUsers[userIndex] = updatedUser;
              renderUserTable(currentUsers);
              closeModals();
              showSuccess('Usuario actualizado correctamente');
              editingUserId = null;
            }
          }
          
          // Eliminar usuario
          function deleteUser(userId) {
            // Si estamos conectados a una API, intentaríamos eliminar el usuario
            if (props.dataSource === 'api' && props.apiEndpoint) {
              showLoader();
              
              // Simulación de API call
              setTimeout(() => {
                currentUsers = currentUsers.filter(u => u.id !== userId);
                renderUserTable(currentUsers);
                showSuccess('Usuario eliminado correctamente');
                hideLoader();
              }, 1000);
            } else {
              // Eliminar directamente de los datos locales
              currentUsers = currentUsers.filter(u => u.id !== userId);
              renderUserTable(currentUsers);
              showSuccess('Usuario eliminado correctamente');
            }
          }
          
          // Cerrar todos los modales
          function closeModals() {
            container.querySelectorAll('.modal').forEach(modal => {
              modal.style.display = 'none';
              modal.classList.remove('show');
            });
            editingUserId = null;
          }
          
          // Mostrar mensaje de éxito
          function showSuccess(message) {
            const alert = container.querySelector('.alert-success');
            if (alert) {
              alert.textContent = message;
              alert.style.display = 'block';
              
              setTimeout(() => {
                alert.style.display = 'none';
              }, 3000);
            }
          }
          
          // Mostrar mensaje de error
          function showError(message) {
            const alert = container.querySelector('.alert-danger');
            if (alert) {
              alert.textContent = message;
              alert.style.display = 'block';
              
              setTimeout(() => {
                alert.style.display = 'none';
              }, 3000);
            }
          }
          
          // Mostrar loader
          function showLoader() {
            const loader = container.querySelector('.user-loader');
            if (loader) {
              loader.style.display = 'flex';
            }
          }
          
          // Ocultar loader
          function hideLoader() {
            const loader = container.querySelector('.user-loader');
            if (loader) {
              loader.style.display = 'none';
            }
          }
          
          // Inicializar componente
          initEventListeners();
          loadUsers();
        }
      }
    },
    view: defaultType.view
  });
  
  // Añadir el bloque para gestión de usuarios
  editor.BlockManager.add('enterprise-user-management', {
    label: 'Gestión de Usuarios',
    category: 'Aplicaciones',
    attributes: { class: 'fa fa-users' },
    content: {
      type: 'enterprise-user-management',
      content: `
        <div class="user-management-container p-3">
          <!-- Alerts -->
          <div class="alert alert-success" role="alert" style="display: none;"></div>
          <div class="alert alert-danger" role="alert" style="display: none;"></div>
          
          <!-- Loader -->
          <div class="user-loader justify-content-center align-items-center" style="display: none; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.7); z-index: 1000;">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>
          
          <!-- Header -->
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h4>Gestión de Usuarios</h4>
            <button class="btn btn-primary btn-create-user">
              <i class="fas fa-plus-circle me-1"></i> Nuevo Usuario
            </button>
          </div>
          
          <!-- Search and Filters -->
          <div class="row mb-4">
            <div class="col-md-6">
              <div class="input-group">
                <span class="input-group-text"><i class="fas fa-search"></i></span>
                <input type="text" class="form-control user-search-input" placeholder="Buscar usuarios...">
              </div>
            </div>
          </div>
          
          <!-- Users Table -->
          <div class="table-responsive">
            <table class="table table-hover user-table">
              <thead class="table-light">
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Último acceso</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <!-- User rows will be generated dynamically -->
              </tbody>
            </table>
          </div>
          
          <!-- Create User Modal -->
          <div class="modal fade" id="create-user-modal" tabindex="-1" style="display: none;">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Nuevo Usuario</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="user-create-form">
                  <div class="modal-body">
                    <div class="mb-3">
                      <label for="new-user-name" class="form-label">Nombre</label>
                      <input type="text" class="form-control" id="new-user-name" required>
                    </div>
                    <div class="mb-3">
                      <label for="new-user-email" class="form-label">Email</label>
                      <input type="email" class="form-control" id="new-user-email" required>
                    </div>
                    <div class="mb-3">
                      <label for="new-user-password" class="form-label">Contraseña</label>
                      <input type="password" class="form-control" id="new-user-password" required>
                    </div>
                    <div class="mb-3">
                      <label for="new-user-role" class="form-label">Rol</label>
                      <select class="form-select" id="new-user-role" required>
                        <!-- Options will be filled dynamically -->
                      </select>
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-cancel" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Guardar</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          <!-- Edit User Modal -->
          <div class="modal fade" id="edit-user-modal" tabindex="-1" style="display: none;">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Editar Usuario</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <form id="user-edit-form">
                  <div class="modal-body">
                    <div class="mb-3">
                      <label for="edit-user-name" class="form-label">Nombre</label>
                      <input type="text" class="form-control" id="edit-user-name" required>
                    </div>
                    <div class="mb-3">
                      <label for="edit-user-email" class="form-label">Email</label>
                      <input type="email" class="form-control" id="edit-user-email" required>
                    </div>
                    <div class="mb-3">
                      <label for="edit-user-role" class="form-label">Rol</label>
                      <select class="form-select" id="edit-user-role" required>
                        <!-- Options will be filled dynamically -->
                      </select>
                    </div>
                    <div class="mb-3">
                      <label for="edit-user-status" class="form-label">Estado</label>
                      <select class="form-select" id="edit-user-status" required>
                        <!-- Options will be filled dynamically -->
                      </select>
                    </div>
                    <div class="mb-3">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="edit-user-reset-password">
                        <label class="form-check-label" for="edit-user-reset-password">
                          Restablecer contraseña
                        </label>
                      </div>
                    </div>
                    <div class="mb-3 reset-password-fields" style="display: none;">
                      <label for="edit-user-new-password" class="form-label">Nueva contraseña</label>
                      <input type="password" class="form-control" id="edit-user-new-password">
                    </div>
                  </div>
                  <div class="modal-footer">
                    <button type="button" class="btn btn-secondary btn-cancel" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Actualizar</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          <!-- Delete User Modal -->
          <div class="modal fade" id="delete-user-modal" tabindex="-1" style="display: none;">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Confirmar eliminación</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <p id="delete-user-text">¿Está seguro que desea eliminar este usuario?</p>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary btn-cancel" data-bs-dismiss="modal">Cancelar</button>
                  <button type="button" class="btn btn-danger btn-confirm-delete">Eliminar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    }
  });
} 