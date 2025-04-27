import { Editor, Component } from 'grapesjs';

export default function (editor: Editor) {
  const domc = editor.DomComponents;
  const defaultType = domc.getType('default');
  const defaultModel = defaultType.model;

  // Registrar el tipo de componente para la tabla de datos
  domc.addType('enterprise-data-table', {
    model: {
      defaults: {
        ...defaultModel.prototype.defaults,
        droppable: false,
        attributes: { class: 'enterprise-data-table' },
        traits: [
          {
            type: 'select',
            name: 'dataSource',
            label: 'Fuente de datos',
            options: [
              { id: 'static', name: 'Datos estáticos' },
              { id: 'api', name: 'API REST' },
              { id: 'database', name: 'Base de datos' }
            ]
          },
          {
            type: 'text',
            name: 'apiEndpoint',
            label: 'URL API'
          },
          {
            type: 'checkbox',
            name: 'pagination',
            label: 'Paginación'
          },
          {
            type: 'checkbox',
            name: 'search',
            label: 'Búsqueda'
          },
          {
            type: 'checkbox',
            name: 'sort',
            label: 'Ordenación'
          },
          {
            type: 'checkbox',
            name: 'export',
            label: 'Exportar (CSV/Excel)'
          }
        ],
        'script-props': ['dataSource', 'apiEndpoint', 'pagination', 'search', 'sort', 'export'],
        script() {
          const props = this.props;
          const tableEl = this.el;
          
          // Función para cargar datos desde API
          const loadData = async () => {
            if (props.dataSource === 'api' && props.apiEndpoint) {
              try {
                tableEl.querySelector('.data-table-loader').style.display = 'block';
                const response = await fetch(props.apiEndpoint);
                if (!response.ok) throw new Error('Error al cargar datos');
                const data = await response.json();
                renderTable(data);
              } catch (error) {
                tableEl.querySelector('.data-table-error').textContent = 
                  `Error: ${error.message}`;
                tableEl.querySelector('.data-table-error').style.display = 'block';
              } finally {
                tableEl.querySelector('.data-table-loader').style.display = 'none';
              }
            }
          };
          
          // Función para renderizar datos en la tabla
          const renderTable = (data) => {
            if (!data || !data.length) return;
            
            const tableBody = tableEl.querySelector('tbody');
            if (!tableBody) return;
            
            // Vaciar tabla
            tableBody.innerHTML = '';
            
            // Obtener columnas de la primera fila
            const columns = Object.keys(data[0]);
            
            // Crear filas
            data.forEach(row => {
              const tr = document.createElement('tr');
              
              columns.forEach(col => {
                const td = document.createElement('td');
                td.textContent = row[col] || '';
                tr.appendChild(td);
              });
              
              // Añadir botones de acción si corresponde
              const td = document.createElement('td');
              td.className = 'actions-cell';
              
              const editBtn = document.createElement('button');
              editBtn.className = 'btn btn-sm btn-primary me-1';
              editBtn.textContent = 'Editar';
              editBtn.onclick = () => alert(`Editar: ${row.id || 'N/A'}`);
              
              const deleteBtn = document.createElement('button');
              deleteBtn.className = 'btn btn-sm btn-danger';
              deleteBtn.textContent = 'Eliminar';
              deleteBtn.onclick = () => {
                if (confirm('¿Seguro que desea eliminar este registro?')) {
                  console.log(`Eliminar: ${row.id || 'N/A'}`);
                  tr.remove();
                }
              };
              
              td.appendChild(editBtn);
              td.appendChild(deleteBtn);
              tr.appendChild(td);
              
              tableBody.appendChild(tr);
            });
          };
          
          // Inicializar búsqueda si está habilitada
          if (props.search) {
            const searchInput = tableEl.querySelector('.data-table-search input');
            if (searchInput) {
              searchInput.oninput = (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const rows = tableEl.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                  const text = row.textContent.toLowerCase();
                  row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
              };
            }
          }
          
          // Inicializar paginación si está habilitada
          if (props.pagination) {
            // Implementar paginación
            const itemsPerPage = 10;
            const paginationContainer = tableEl.querySelector('.data-table-pagination');
            const rowCount = tableEl.querySelectorAll('tbody tr').length;
            const pageCount = Math.ceil(rowCount / itemsPerPage);
            
            if (paginationContainer) {
              paginationContainer.innerHTML = '';
              
              for (let i = 1; i <= pageCount; i++) {
                const pageLink = document.createElement('button');
                pageLink.className = 'btn btn-sm btn-outline-primary mx-1';
                pageLink.textContent = i.toString();
                pageLink.onclick = () => {
                  // Ocultar todas las filas
                  const rows = tableEl.querySelectorAll('tbody tr');
                  rows.forEach((row, index) => {
                    const showInThisPage = index >= (i - 1) * itemsPerPage && 
                                          index < i * itemsPerPage;
                    row.style.display = showInThisPage ? '' : 'none';
                  });
                  
                  // Marcar este botón como activo
                  const paginationBtns = paginationContainer.querySelectorAll('button');
                  paginationBtns.forEach(btn => 
                    btn.classList.toggle('active', btn === pageLink));
                };
                paginationContainer.appendChild(pageLink);
              }
              
              // Activar primera página
              const firstPageBtn = paginationContainer.querySelector('button');
              if (firstPageBtn) firstPageBtn.click();
            }
          }
          
          // Inicializar exportación si está habilitada
          if (props.export) {
            const exportBtn = tableEl.querySelector('.data-table-export button');
            if (exportBtn) {
              exportBtn.onclick = () => {
                const table = tableEl.querySelector('table');
                if (!table) return;
                
                // Función para exportar a CSV
                const exportToCSV = () => {
                  const rows = table.querySelectorAll('tr');
                  let csv = [];
                  
                  rows.forEach(row => {
                    const rowData = [];
                    row.querySelectorAll('th, td').forEach(cell => {
                      // Ignorar celdas de acciones
                      if (!cell.classList.contains('actions-cell')) {
                        rowData.push(`"${cell.textContent.replace(/"/g, '""')}"`);
                      }
                    });
                    csv.push(rowData.join(','));
                  });
                  
                  // Crear archivo de descarga
                  const csvContent = csv.join('\n');
                  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', 'datos_exportados.csv');
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                };
                
                exportToCSV();
              };
            }
          }
          
          // Cargar datos iniciales
          loadData();
        }
      }
    },
    view: defaultType.view
  });
  
  // Añadir el bloque para la tabla de datos
  editor.BlockManager.add('enterprise-data-table', {
    label: 'Tabla de Datos',
    category: 'Aplicaciones',
    attributes: { class: 'fa fa-table' },
    content: {
      type: 'enterprise-data-table',
      content: `
        <div class="card border mb-4">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Tabla de Datos</h5>
            
            <div class="d-flex">
              <!-- Búsqueda -->
              <div class="data-table-search me-2">
                <input type="text" class="form-control form-control-sm" placeholder="Buscar...">
              </div>
              
              <!-- Exportar -->
              <div class="data-table-export">
                <button class="btn btn-sm btn-outline-secondary">
                  <i class="fa fa-download"></i> Exportar
                </button>
              </div>
            </div>
          </div>
          
          <div class="card-body p-0">
            <!-- Loader -->
            <div class="data-table-loader text-center py-4" style="display: none;">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
            </div>
            
            <!-- Error message -->
            <div class="data-table-error alert alert-danger m-3" style="display: none;"></div>
            
            <!-- Tabla -->
            <div class="table-responsive">
              <table class="table table-striped table-hover mb-0">
                <thead class="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Datos de muestra, se reemplazarán con datos reales -->
                  <tr>
                    <td>1</td>
                    <td>Juan Pérez</td>
                    <td>juan@ejemplo.com</td>
                    <td>+34 612 345 678</td>
                    <td>01/01/2023</td>
                    <td><span class="badge bg-success">Activo</span></td>
                    <td class="actions-cell">
                      <button class="btn btn-sm btn-primary me-1">Editar</button>
                      <button class="btn btn-sm btn-danger">Eliminar</button>
                    </td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>María García</td>
                    <td>maria@ejemplo.com</td>
                    <td>+34 623 456 789</td>
                    <td>15/02/2023</td>
                    <td><span class="badge bg-warning">Pendiente</span></td>
                    <td class="actions-cell">
                      <button class="btn btn-sm btn-primary me-1">Editar</button>
                      <button class="btn btn-sm btn-danger">Eliminar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Paginación -->
          <div class="card-footer bg-light">
            <div class="data-table-pagination d-flex justify-content-center">
              <!-- Botones de paginación generados dinámicamente -->
            </div>
          </div>
        </div>
      `
    }
  });
} 