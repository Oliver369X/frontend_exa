import { Editor } from 'grapesjs';

export default function(editor: Editor) {
  const domc = editor.DomComponents;
  const defaultType = domc.getType('default');
  const defaultModel = defaultType.model;

  // Registrar el tipo de componente para el grid de datos
  domc.addType('business-data-grid', {
    model: {
      defaults: {
        ...defaultModel.prototype.defaults,
        droppable: false,
        attributes: { class: 'business-data-grid' },
        traits: [
          {
            type: 'select',
            name: 'dataSource',
            label: 'Fuente de datos',
            options: [
              { id: 'api', name: 'API' },
              { id: 'sample', name: 'Datos de muestra' }
            ]
          },
          {
            type: 'text',
            name: 'apiEndpoint',
            label: 'URL de API'
          },
          {
            type: 'number',
            name: 'pageSize',
            label: 'Elementos por página',
            min: 5,
            max: 100,
            value: 10
          },
          {
            type: 'checkbox',
            name: 'enableSearch',
            label: 'Habilitar búsqueda'
          },
          {
            type: 'checkbox',
            name: 'enableFilters',
            label: 'Habilitar filtros'
          },
          {
            type: 'checkbox',
            name: 'enableSorting',
            label: 'Habilitar ordenación'
          },
          {
            type: 'checkbox',
            name: 'enableExport',
            label: 'Habilitar exportación'
          },
          {
            type: 'checkbox',
            name: 'responsiveLayout',
            label: 'Diseño responsive'
          }
        ],
        'script-props': ['dataSource', 'apiEndpoint', 'pageSize', 'enableSearch', 'enableFilters', 'enableSorting', 'enableExport', 'responsiveLayout'],
        script() {
          const props = this.props;
          const container = this.el;
          
          // Datos de muestra para uso cuando no hay API
          const SAMPLE_DATA = [
            { id: 1, nombre: 'Juan Pérez', email: 'juan@ejemplo.com', rol: 'Administrador', estado: 'Activo', fechaRegistro: '2023-01-15' },
            { id: 2, nombre: 'María López', email: 'maria@ejemplo.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2023-02-20' },
            { id: 3, nombre: 'Carlos Ruiz', email: 'carlos@ejemplo.com', rol: 'Editor', estado: 'Inactivo', fechaRegistro: '2023-03-10' },
            { id: 4, nombre: 'Ana Martínez', email: 'ana@ejemplo.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2023-04-05' },
            { id: 5, nombre: 'Pedro González', email: 'pedro@ejemplo.com', rol: 'Editor', estado: 'Activo', fechaRegistro: '2023-05-12' },
            { id: 6, nombre: 'Laura Sánchez', email: 'laura@ejemplo.com', rol: 'Usuario', estado: 'Inactivo', fechaRegistro: '2023-06-18' },
            { id: 7, nombre: 'Miguel Torres', email: 'miguel@ejemplo.com', rol: 'Administrador', estado: 'Activo', fechaRegistro: '2023-07-22' },
            { id: 8, nombre: 'Sofía Ramírez', email: 'sofia@ejemplo.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2023-08-30' },
            { id: 9, nombre: 'Javier Morales', email: 'javier@ejemplo.com', rol: 'Editor', estado: 'Inactivo', fechaRegistro: '2023-09-14' },
            { id: 10, nombre: 'Elena Vargas', email: 'elena@ejemplo.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2023-10-05' },
            { id: 11, nombre: 'Roberto Flores', email: 'roberto@ejemplo.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2023-11-11' },
            { id: 12, nombre: 'Carmen Díaz', email: 'carmen@ejemplo.com', rol: 'Editor', estado: 'Activo', fechaRegistro: '2023-12-20' },
            { id: 13, nombre: 'Daniel Castro', email: 'daniel@ejemplo.com', rol: 'Usuario', estado: 'Inactivo', fechaRegistro: '2024-01-07' },
            { id: 14, nombre: 'Isabel Reyes', email: 'isabel@ejemplo.com', rol: 'Administrador', estado: 'Activo', fechaRegistro: '2024-02-15' },
            { id: 15, nombre: 'Raúl Ortega', email: 'raul@ejemplo.com', rol: 'Usuario', estado: 'Activo', fechaRegistro: '2024-03-22' }
          ];
          
          // Estado de la tabla
          let tableData = [];
          let filteredData = [];
          let currentPage = 1;
          let pageSize = props.pageSize || 10;
          let sortField = null;
          let sortDirection = 'asc';
          let searchTerm = '';
          let filters = {};
          
          // Referencias a elementos DOM
          let tableBody, pagination, searchInput, exportButton, filterDropdowns;
          
          // Inicializar la tabla
          const initializeTable = async () => {
            // Cargar datos
            await loadData();
            
            // Inicializar referencias
            tableBody = container.querySelector('.data-grid-tbody');
            pagination = container.querySelector('.data-grid-pagination');
            searchInput = container.querySelector('.data-grid-search-input');
            exportButton = container.querySelector('.data-grid-export-btn');
            
            // Configurar eventos
            setupEvents();
            
            // Renderizar tabla inicial
            renderTable();
          };
          
          // Cargar datos desde la fuente seleccionada
          const loadData = async () => {
            const dataSource = props.dataSource || 'sample';
            
            if (dataSource === 'api' && props.apiEndpoint) {
              try {
                const response = await fetch(props.apiEndpoint);
                if (!response.ok) {
                  throw new Error('Error al cargar los datos de la API');
                }
                const data = await response.json();
                tableData = Array.isArray(data) ? data : (data.items || data.results || data.data || []);
              } catch (error) {
                console.error('Error al cargar datos de la API:', error);
                tableData = [...SAMPLE_DATA]; // Usar datos de muestra como fallback
              }
            } else {
              // Usar datos de muestra
              tableData = [...SAMPLE_DATA];
            }
            
            // Inicializar datos filtrados
            filteredData = [...tableData];
          };
          
          // Configurar eventos de los controles
          const setupEvents = () => {
            // Evento de búsqueda
            if (props.enableSearch && searchInput) {
              searchInput.addEventListener('input', (e) => {
                searchTerm = e.target.value.toLowerCase();
                currentPage = 1;
                applyFiltersAndSort();
                renderTable();
              });
            }
            
            // Eventos de ordenación en encabezados
            if (props.enableSorting) {
              const headers = container.querySelectorAll('.data-grid-th[data-sortable="true"]');
              headers.forEach(header => {
                header.addEventListener('click', () => {
                  const field = header.getAttribute('data-field');
                  
                  // Cambiar dirección si ya está ordenando por este campo
                  if (sortField === field) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                  } else {
                    sortField = field;
                    sortDirection = 'asc';
                  }
                  
                  // Actualizar visual de ordenación
                  updateSortIndicators();
                  
                  // Aplicar ordenación y renderizar
                  applyFiltersAndSort();
                  renderTable();
                });
              });
            }
            
            // Eventos de filtros
            if (props.enableFilters) {
              filterDropdowns = container.querySelectorAll('.data-grid-filter');
              filterDropdowns.forEach(filter => {
                filter.addEventListener('change', (e) => {
                  const field = filter.getAttribute('data-field');
                  const value = e.target.value;
                  
                  if (value === '') {
                    delete filters[field];
                  } else {
                    filters[field] = value;
                  }
                  
                  currentPage = 1;
                  applyFiltersAndSort();
                  renderTable();
                });
              });
            }
            
            // Evento de exportación
            if (props.enableExport && exportButton) {
              exportButton.addEventListener('click', exportTableData);
            }
          };
          
          // Aplicar filtros, búsqueda y ordenación
          const applyFiltersAndSort = () => {
            // Primero aplicar búsqueda global
            if (searchTerm) {
              filteredData = tableData.filter(row => {
                return Object.values(row).some(value => 
                  String(value).toLowerCase().includes(searchTerm)
                );
              });
            } else {
              filteredData = [...tableData];
            }
            
            // Luego aplicar filtros por campo
            if (Object.keys(filters).length > 0) {
              filteredData = filteredData.filter(row => {
                return Object.entries(filters).every(([field, value]) => {
                  return String(row[field]).toLowerCase() === String(value).toLowerCase();
                });
              });
            }
            
            // Finalmente ordenar
            if (sortField) {
              filteredData.sort((a, b) => {
                const aValue = a[sortField];
                const bValue = b[sortField];
                
                // Ordenar según el tipo de datos
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                  return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
                } else {
                  const aStr = String(aValue || '').toLowerCase();
                  const bStr = String(bValue || '').toLowerCase();
                  return sortDirection === 'asc' 
                    ? aStr.localeCompare(bStr) 
                    : bStr.localeCompare(aStr);
                }
              });
            }
          };
          
          // Actualizar indicadores visuales de ordenación
          const updateSortIndicators = () => {
            const headers = container.querySelectorAll('.data-grid-th[data-sortable="true"]');
            headers.forEach(header => {
              const field = header.getAttribute('data-field');
              
              // Eliminar clases existentes
              header.classList.remove('sort-asc', 'sort-desc');
              
              if (field === sortField) {
                header.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
              }
            });
          };
          
          // Renderizar la tabla con los datos actuales
          const renderTable = () => {
            if (!tableBody) return;
            
            // Calcular datos de la página actual
            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const pageData = filteredData.slice(startIndex, endIndex);
            
            // Limpiar tabla
            tableBody.innerHTML = '';
            
            // Mostrar mensaje si no hay datos
            if (pageData.length === 0) {
              const tr = document.createElement('tr');
              tr.innerHTML = `<td colspan="100%" class="text-center py-4">No se encontraron datos</td>`;
              tableBody.appendChild(tr);
            } else {
              // Renderizar filas
              pageData.forEach(row => {
                const tr = document.createElement('tr');
                
                // Obtener campos de los encabezados
                const headers = container.querySelectorAll('.data-grid-th[data-field]');
                headers.forEach(header => {
                  const field = header.getAttribute('data-field');
                  const td = document.createElement('td');
                  td.className = 'data-grid-td';
                  td.textContent = row[field] !== undefined ? row[field] : '';
                  tr.appendChild(td);
                });
                
                tableBody.appendChild(tr);
              });
            }
            
            // Actualizar paginación
            renderPagination();
          };
          
          // Renderizar controles de paginación
          const renderPagination = () => {
            if (!pagination) return;
            
            const totalPages = Math.ceil(filteredData.length / pageSize);
            
            pagination.innerHTML = '';
            
            // Botón "Anterior"
            const prevButton = document.createElement('button');
            prevButton.className = 'btn btn-sm btn-outline-secondary me-1';
            prevButton.textContent = '«';
            prevButton.disabled = currentPage === 1;
            prevButton.addEventListener('click', () => {
              if (currentPage > 1) {
                currentPage--;
                renderTable();
              }
            });
            pagination.appendChild(prevButton);
            
            // Páginas numeradas (máximo 5)
            const maxPages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
            const endPage = Math.min(totalPages, startPage + maxPages - 1);
            startPage = Math.max(1, endPage - maxPages + 1);
            
            for (let i = startPage; i <= endPage; i++) {
              const pageButton = document.createElement('button');
              pageButton.className = `btn btn-sm ${i === currentPage ? 'btn-primary' : 'btn-outline-secondary'} me-1`;
              pageButton.textContent = i.toString();
              pageButton.addEventListener('click', () => {
                currentPage = i;
                renderTable();
              });
              pagination.appendChild(pageButton);
            }
            
            // Botón "Siguiente"
            const nextButton = document.createElement('button');
            nextButton.className = 'btn btn-sm btn-outline-secondary';
            nextButton.textContent = '»';
            nextButton.disabled = currentPage === totalPages;
            nextButton.addEventListener('click', () => {
              if (currentPage < totalPages) {
                currentPage++;
                renderTable();
              }
            });
            pagination.appendChild(nextButton);
            
            // Información de página
            const pageInfo = document.createElement('span');
            pageInfo.className = 'ms-3 text-muted';
            pageInfo.textContent = `Página ${currentPage} de ${totalPages || 1} (${filteredData.length} registros)`;
            pagination.appendChild(pageInfo);
          };
          
          // Exportar datos a CSV
          const exportTableData = () => {
            // Función para escapar valores CSV
            const escapeCSV = (value) => {
              let result = String(value || '');
              if (result.includes(',') || result.includes('"') || result.includes('\n')) {
                result = '"' + result.replace(/"/g, '""') + '"';
              }
              return result;
            };
            
            // Obtener encabezados
            const headers = Array.from(container.querySelectorAll('.data-grid-th[data-field]'));
            const headerNames = headers.map(h => h.textContent);
            const fields = headers.map(h => h.getAttribute('data-field'));
            
            // Crear contenido CSV
            let csvContent = headerNames.map(escapeCSV).join(',') + '\n';
            
            // Agregar filas
            filteredData.forEach(row => {
              const values = fields.map(field => escapeCSV(row[field]));
              csvContent += values.join(',') + '\n';
            });
            
            // Crear archivo y descargarlo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', 'tabla_datos.csv');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };
          
          // Inicializar al cargar
          initializeTable();
          
          // Estilos CSS responsivos
          if (props.responsiveLayout) {
            const style = document.createElement('style');
            style.textContent = `
              @media (max-width: 767px) {
                .business-data-grid .table-responsive {
                  overflow-x: auto;
                }
                
                .business-data-grid .data-grid-controls {
                  flex-direction: column;
                  align-items: stretch !important;
                }
                
                .business-data-grid .data-grid-search {
                  margin-bottom: 1rem;
                  width: 100%;
                }
                
                .business-data-grid .data-grid-actions {
                  justify-content: space-between;
                  width: 100%;
                }
              }
            `;
            document.head.appendChild(style);
          }
        }
      }
    },
    view: defaultType.view
  });

  // Añadir el bloque para la tabla de datos
  editor.BlockManager.add('business-data-grid', {
    label: 'Tabla de Datos',
    category: 'Negocios',
    attributes: { class: 'fa fa-table' },
    content: {
      type: 'business-data-grid',
      content: `
        <div class="card border mb-4">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 class="mb-0">Listado de Usuarios</h5>
          </div>
          <div class="card-body">
            <div class="data-grid-controls d-flex justify-content-between align-items-center mb-3">
              <div class="data-grid-search">
                <div class="input-group">
                  <span class="input-group-text"><i class="fa fa-search"></i></span>
                  <input type="text" class="form-control data-grid-search-input" placeholder="Buscar...">
                </div>
              </div>
              <div class="data-grid-actions">
                <select class="form-select data-grid-filter me-2" data-field="rol">
                  <option value="">Todos los roles</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Editor">Editor</option>
                  <option value="Usuario">Usuario</option>
                </select>
                <select class="form-select data-grid-filter me-2" data-field="estado">
                  <option value="">Todos los estados</option>
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
                <button class="btn btn-outline-success data-grid-export-btn">
                  <i class="fa fa-download me-1"></i> Exportar
                </button>
              </div>
            </div>
            
            <div class="table-responsive">
              <table class="table table-striped table-hover">
                <thead>
                  <tr>
                    <th class="data-grid-th" data-field="id" data-sortable="true">#</th>
                    <th class="data-grid-th" data-field="nombre" data-sortable="true">Nombre</th>
                    <th class="data-grid-th" data-field="email" data-sortable="true">Email</th>
                    <th class="data-grid-th" data-field="rol" data-sortable="true">Rol</th>
                    <th class="data-grid-th" data-field="estado" data-sortable="true">Estado</th>
                    <th class="data-grid-th" data-field="fechaRegistro" data-sortable="true">Fecha</th>
                  </tr>
                </thead>
                <tbody class="data-grid-tbody">
                  <!-- Los datos se cargarán dinámicamente -->
                </tbody>
              </table>
            </div>
            
            <div class="d-flex justify-content-between align-items-center mt-3">
              <div class="data-grid-pagination">
                <!-- La paginación se generará dinámicamente -->
              </div>
              <div>
                <select class="form-select" onchange="this.parentNode.parentNode.previousElementSibling.querySelector('.data-grid-tbody').setAttribute('data-page-size', this.value)">
                  <option value="10">10 por página</option>
                  <option value="25">25 por página</option>
                  <option value="50">50 por página</option>
                  <option value="100">100 por página</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      `
    }
  });
} 