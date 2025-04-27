import { Editor } from 'grapesjs';

export default function (editor: Editor) {
  const domc = editor.DomComponents;
  const defaultType = domc.getType('default');
  const defaultModel = defaultType.model;

  // Registrar el tipo de componente para el dashboard
  domc.addType('enterprise-dashboard', {
    model: {
      defaults: {
        ...defaultModel.prototype.defaults,
        droppable: true,
        attributes: { class: 'enterprise-dashboard' },
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
            type: 'select',
            name: 'refreshInterval',
            label: 'Auto actualizar',
            options: [
              { id: '0', name: 'No' },
              { id: '30', name: 'Cada 30s' },
              { id: '60', name: 'Cada 1m' },
              { id: '300', name: 'Cada 5m' }
            ]
          }
        ],
        'script-props': ['dataSource', 'apiEndpoint', 'refreshInterval'],
        script() {
          const props = this.props;
          const dashboardEl = this.el;
          let refreshIntervalId = null;
          let chartInstances = [];
          
          // Función para cargar datos
          const loadData = async () => {
            if (props.dataSource === 'api' && props.apiEndpoint) {
              try {
                // Mostrar indicador de carga
                dashboardEl.querySelectorAll('.dashboard-loading').forEach(el => {
                  el.style.display = 'flex';
                });
                
                const response = await fetch(props.apiEndpoint);
                if (!response.ok) throw new Error('Error al cargar datos');
                const data = await response.json();
                
                updateDashboardWidgets(data);
              } catch (error) {
                console.error('Error cargando datos del dashboard:', error);
                // Mostrar mensaje de error
                dashboardEl.querySelectorAll('.dashboard-error').forEach(el => {
                  el.textContent = `Error: ${error.message}`;
                  el.style.display = 'block';
                });
              } finally {
                // Ocultar indicador de carga
                dashboardEl.querySelectorAll('.dashboard-loading').forEach(el => {
                  el.style.display = 'none';
                });
              }
            } else {
              // Usar datos de muestra
              const sampleData = {
                kpis: [
                  { label: 'Ingresos', value: '€38,289', change: '+12.5%', positive: true },
                  { label: 'Usuarios', value: '1,938', change: '+8.2%', positive: true },
                  { label: 'Conversión', value: '3.24%', change: '-0.5%', positive: false },
                  { label: 'Tickets', value: '42', change: '-15.8%', positive: true }
                ],
                revenueData: {
                  labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                  datasets: [
                    {
                      label: 'Ingresos 2023',
                      data: [18000, 22000, 19000, 27000, 28000, 32000, 36000, 35000, 30000, 28000, 32000, 38000],
                      borderColor: 'rgba(75, 192, 192, 1)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    }
                  ]
                },
                salesByCategory: {
                  labels: ['Productos', 'Servicios', 'Suscripciones', 'Otros'],
                  datasets: [
                    {
                      data: [45, 30, 20, 5],
                      backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(255, 99, 132, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                      ],
                    }
                  ]
                },
                recentSales: [
                  { id: 1, customer: 'Juan García', product: 'Software Pro', amount: '€1,200', date: '20/11/2023', status: 'Completado' },
                  { id: 2, customer: 'María López', product: 'Suscripción Anual', amount: '€599', date: '18/11/2023', status: 'Completado' },
                  { id: 3, customer: 'Carlos Ruiz', product: 'Consultoría', amount: '€850', date: '15/11/2023', status: 'Pendiente' },
                  { id: 4, customer: 'Ana Martínez', product: 'Licencia Premium', amount: '€350', date: '10/11/2023', status: 'Completado' },
                  { id: 5, customer: 'Pedro Sánchez', product: 'Soporte Técnico', amount: '€120', date: '08/11/2023', status: 'Cancelado' }
                ]
              };
              
              updateDashboardWidgets(sampleData);
            }
          };
          
          // Función para actualizar widgets del dashboard
          const updateDashboardWidgets = (data) => {
            // Actualizar KPIs
            if (data.kpis) {
              const kpiWidgets = dashboardEl.querySelectorAll('.dashboard-kpi');
              data.kpis.forEach((kpi, index) => {
                if (kpiWidgets[index]) {
                  const widget = kpiWidgets[index];
                  widget.querySelector('.kpi-value').textContent = kpi.value;
                  
                  const changeEl = widget.querySelector('.kpi-change');
                  if (changeEl) {
                    changeEl.textContent = kpi.change;
                    changeEl.className = 'kpi-change ' + 
                      (kpi.positive ? 'text-success' : 'text-danger');
                    
                    // Actualizar icono
                    const iconEl = changeEl.querySelector('i');
                    if (iconEl) {
                      iconEl.className = 'fas ' + 
                        (kpi.positive ? 'fa-arrow-up' : 'fa-arrow-down');
                    }
                  }
                }
              });
            }
            
            // Actualizar gráficos
            updateCharts(data);
            
            // Actualizar tabla de ventas recientes
            if (data.recentSales) {
              const tableBody = dashboardEl.querySelector('.recent-sales-table tbody');
              if (tableBody) {
                tableBody.innerHTML = '';
                
                data.recentSales.forEach(sale => {
                  const row = document.createElement('tr');
                  
                  // Estado con clase de color
                  let statusClass = 'bg-success';
                  if (sale.status === 'Pendiente') statusClass = 'bg-warning';
                  if (sale.status === 'Cancelado') statusClass = 'bg-danger';
                  
                  row.innerHTML = `
                    <td>${sale.id}</td>
                    <td>${sale.customer}</td>
                    <td>${sale.product}</td>
                    <td>${sale.amount}</td>
                    <td>${sale.date}</td>
                    <td><span class="badge ${statusClass}">${sale.status}</span></td>
                  `;
                  
                  tableBody.appendChild(row);
                });
              }
            }
          };
          
          // Función para actualizar gráficos
          const updateCharts = (data) => {
            // Limpiar gráficos existentes
            if (chartInstances.length > 0) {
              chartInstances.forEach(chart => chart.destroy());
              chartInstances = [];
            }
            
            // Verificar si Chart.js está disponible
            if (typeof Chart === 'undefined') {
              console.error('Chart.js no está disponible');
              return;
            }
            
            // Gráfico de ingresos (línea)
            if (data.revenueData) {
              const revenueCanvas = dashboardEl.querySelector('#revenue-chart');
              if (revenueCanvas) {
                const revenueChart = new Chart(revenueCanvas, {
                  type: 'line',
                  data: data.revenueData,
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Ingresos Mensuales'
                      }
                    }
                  }
                });
                
                chartInstances.push(revenueChart);
              }
            }
            
            // Gráfico de ventas por categoría (dona)
            if (data.salesByCategory) {
              const categoryCanvas = dashboardEl.querySelector('#category-chart');
              if (categoryCanvas) {
                const categoryChart = new Chart(categoryCanvas, {
                  type: 'doughnut',
                  data: data.salesByCategory,
                  options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Ventas por Categoría'
                      }
                    }
                  }
                });
                
                chartInstances.push(categoryChart);
              }
            }
          };
          
          // Inicializar carga de datos
          loadData();
          
          // Configurar intervalo de actualización si está habilitado
          if (props.refreshInterval && parseInt(props.refreshInterval) > 0) {
            const interval = parseInt(props.refreshInterval) * 1000;
            refreshIntervalId = setInterval(loadData, interval);
          }
          
          // Limpiar intervalo cuando se destruya el componente
          this.onDestroy = () => {
            if (refreshIntervalId) {
              clearInterval(refreshIntervalId);
            }
            
            // Destruir gráficos
            chartInstances.forEach(chart => chart.destroy());
          };
        }
      }
    },
    view: defaultType.view
  });
  
  // Añadir el bloque para el dashboard
  editor.BlockManager.add('enterprise-dashboard', {
    label: 'Dashboard Ejecutivo',
    category: 'Aplicaciones',
    attributes: { class: 'fa fa-chart-line' },
    content: {
      type: 'enterprise-dashboard',
      content: `
        <div class="dashboard-container p-3">
          <!-- KPIs Row -->
          <div class="row g-3 mb-4">
            <div class="col-md-3">
              <div class="dashboard-kpi card h-100 border-0 shadow-sm">
                <div class="card-body">
                  <h6 class="card-subtitle mb-2 text-muted">Ingresos</h6>
                  <h3 class="kpi-value mb-0">€38,289</h3>
                  <p class="kpi-change text-success mb-0">
                    <i class="fas fa-arrow-up me-1"></i>+12.5%
                  </p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="dashboard-kpi card h-100 border-0 shadow-sm">
                <div class="card-body">
                  <h6 class="card-subtitle mb-2 text-muted">Usuarios</h6>
                  <h3 class="kpi-value mb-0">1,938</h3>
                  <p class="kpi-change text-success mb-0">
                    <i class="fas fa-arrow-up me-1"></i>+8.2%
                  </p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="dashboard-kpi card h-100 border-0 shadow-sm">
                <div class="card-body">
                  <h6 class="card-subtitle mb-2 text-muted">Conversión</h6>
                  <h3 class="kpi-value mb-0">3.24%</h3>
                  <p class="kpi-change text-danger mb-0">
                    <i class="fas fa-arrow-down me-1"></i>-0.5%
                  </p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="dashboard-kpi card h-100 border-0 shadow-sm">
                <div class="card-body">
                  <h6 class="card-subtitle mb-2 text-muted">Tickets</h6>
                  <h3 class="kpi-value mb-0">42</h3>
                  <p class="kpi-change text-success mb-0">
                    <i class="fas fa-arrow-down me-1"></i>-15.8%
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Charts Row -->
          <div class="row g-3 mb-4">
            <div class="col-md-8">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-transparent border-0">
                  <h5 class="card-title mb-0">Ingresos Mensuales</h5>
                </div>
                <div class="card-body">
                  <div class="dashboard-loading justify-content-center align-items-center" style="display: none; height: 250px;">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                  <div class="dashboard-error alert alert-danger" style="display: none;"></div>
                  <div class="chart-container" style="position: relative; height: 250px;">
                    <canvas id="revenue-chart"></canvas>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-4">
              <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-transparent border-0">
                  <h5 class="card-title mb-0">Ventas por Categoría</h5>
                </div>
                <div class="card-body">
                  <div class="dashboard-loading justify-content-center align-items-center" style="display: none; height: 250px;">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                  <div class="dashboard-error alert alert-danger" style="display: none;"></div>
                  <div class="chart-container" style="position: relative; height: 250px;">
                    <canvas id="category-chart"></canvas>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Recent Sales Table -->
          <div class="row g-3">
            <div class="col-12">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-transparent border-0 d-flex justify-content-between align-items-center">
                  <h5 class="card-title mb-0">Ventas Recientes</h5>
                  <button class="btn btn-sm btn-outline-primary">Ver Todas</button>
                </div>
                <div class="card-body">
                  <div class="dashboard-loading justify-content-center align-items-center" style="display: none; height: 100px;">
                    <div class="spinner-border text-primary" role="status">
                      <span class="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                  <div class="dashboard-error alert alert-danger" style="display: none;"></div>
                  <div class="table-responsive">
                    <table class="table table-hover recent-sales-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Cliente</th>
                          <th>Producto</th>
                          <th>Importe</th>
                          <th>Fecha</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>Juan García</td>
                          <td>Software Pro</td>
                          <td>€1,200</td>
                          <td>20/11/2023</td>
                          <td><span class="badge bg-success">Completado</span></td>
                        </tr>
                        <tr>
                          <td>2</td>
                          <td>María López</td>
                          <td>Suscripción Anual</td>
                          <td>€599</td>
                          <td>18/11/2023</td>
                          <td><span class="badge bg-success">Completado</span></td>
                        </tr>
                        <tr>
                          <td>3</td>
                          <td>Carlos Ruiz</td>
                          <td>Consultoría</td>
                          <td>€850</td>
                          <td>15/11/2023</td>
                          <td><span class="badge bg-warning">Pendiente</span></td>
                        </tr>
                        <tr>
                          <td>4</td>
                          <td>Ana Martínez</td>
                          <td>Licencia Premium</td>
                          <td>€350</td>
                          <td>10/11/2023</td>
                          <td><span class="badge bg-success">Completado</span></td>
                        </tr>
                        <tr>
                          <td>5</td>
                          <td>Pedro Sánchez</td>
                          <td>Soporte Técnico</td>
                          <td>€120</td>
                          <td>08/11/2023</td>
                          <td><span class="badge bg-danger">Cancelado</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    }
  });
} 