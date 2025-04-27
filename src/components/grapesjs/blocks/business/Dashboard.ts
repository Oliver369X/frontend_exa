import { Editor } from 'grapesjs';

export default function(editor: Editor) {
  const domc = editor.DomComponents;
  const defaultType = domc.getType('default');
  const defaultModel = defaultType.model;

  // Registrar el componente de tarjeta estadística
  domc.addType('business-stat-card', {
    model: {
      defaults: {
        ...defaultModel.prototype.defaults,
        droppable: false,
        attributes: { class: 'business-stat-card' },
        traits: [
          {
            type: 'text',
            name: 'title',
            label: 'Título'
          },
          {
            type: 'text',
            name: 'value',
            label: 'Valor'
          },
          {
            type: 'select',
            name: 'trend',
            label: 'Tendencia',
            options: [
              { id: 'up', name: 'Subiendo' },
              { id: 'down', name: 'Bajando' },
              { id: 'neutral', name: 'Neutral' }
            ]
          },
          {
            type: 'text',
            name: 'trendValue',
            label: 'Valor de tendencia'
          },
          {
            type: 'text',
            name: 'icon',
            label: 'Icono (Clase FontAwesome)',
            placeholder: 'fa fa-users'
          },
          {
            type: 'color',
            name: 'color',
            label: 'Color de acento'
          }
        ],
        'script-props': ['title', 'value', 'trend', 'trendValue', 'icon', 'color'],
        script() {
          const props = this.props;
          const el = this.el;
          
          // Actualizar título
          if (props.title) {
            const titleEl = el.querySelector('.stat-card-title');
            if (titleEl) titleEl.textContent = props.title;
          }
          
          // Actualizar valor
          if (props.value) {
            const valueEl = el.querySelector('.stat-card-value');
            if (valueEl) valueEl.textContent = props.value;
          }
          
          // Actualizar tendencia
          const trendEl = el.querySelector('.stat-card-trend');
          if (trendEl && props.trend && props.trendValue) {
            let trendIcon = '';
            let trendClass = '';
            
            if (props.trend === 'up') {
              trendIcon = '<i class="fas fa-arrow-up me-1"></i>';
              trendClass = 'text-success';
            } else if (props.trend === 'down') {
              trendIcon = '<i class="fas fa-arrow-down me-1"></i>';
              trendClass = 'text-danger';
            } else {
              trendIcon = '<i class="fas fa-minus me-1"></i>';
              trendClass = 'text-muted';
            }
            
            trendEl.className = `stat-card-trend small ${trendClass}`;
            trendEl.innerHTML = `${trendIcon}${props.trendValue}`;
          }
          
          // Actualizar icono
          if (props.icon) {
            const iconEl = el.querySelector('.stat-card-icon');
            if (iconEl) {
              iconEl.innerHTML = `<i class="${props.icon}"></i>`;
            }
          }
          
          // Actualizar color
          if (props.color) {
            const iconEl = el.querySelector('.stat-card-icon');
            if (iconEl) {
              iconEl.style.backgroundColor = props.color;
            }
          }
        }
      }
    },
    view: defaultType.view
  });
  
  // Registrar el componente de gráfico
  domc.addType('business-chart', {
    model: {
      defaults: {
        ...defaultModel.prototype.defaults,
        droppable: false,
        attributes: { class: 'business-chart' },
        traits: [
          {
            type: 'select',
            name: 'chartType',
            label: 'Tipo de gráfico',
            options: [
              { id: 'line', name: 'Línea' },
              { id: 'bar', name: 'Barras' },
              { id: 'pie', name: 'Circular' },
              { id: 'doughnut', name: 'Dona' }
            ]
          },
          {
            type: 'text',
            name: 'title',
            label: 'Título'
          },
          {
            type: 'checkbox',
            name: 'showLegend',
            label: 'Mostrar leyenda'
          },
          {
            type: 'select',
            name: 'dataSource',
            label: 'Fuente de datos',
            options: [
              { id: 'sample', name: 'Datos de muestra' },
              { id: 'api', name: 'API' }
            ]
          },
          {
            type: 'text',
            name: 'apiEndpoint',
            label: 'URL de API'
          }
        ],
        'script-props': ['chartType', 'title', 'showLegend', 'dataSource', 'apiEndpoint'],
        script() {
          const props = this.props;
          const el = this.el;
          
          // Datos de muestra
          const SAMPLE_DATA = {
            line: {
              labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
              datasets: [
                {
                  label: 'Ventas 2023',
                  data: [12, 19, 3, 5, 2, 3],
                  borderColor: 'rgba(75, 192, 192, 1)',
                  tension: 0.1,
                  fill: false
                },
                {
                  label: 'Ventas 2024',
                  data: [5, 15, 10, 12, 8, 14],
                  borderColor: 'rgba(153, 102, 255, 1)',
                  tension: 0.1,
                  fill: false
                }
              ]
            },
            bar: {
              labels: ['Q1', 'Q2', 'Q3', 'Q4'],
              datasets: [
                {
                  label: 'Ingresos',
                  data: [12, 19, 3, 5],
                  backgroundColor: 'rgba(54, 162, 235, 0.5)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1
                },
                {
                  label: 'Gastos',
                  data: [7, 11, 5, 8],
                  backgroundColor: 'rgba(255, 99, 132, 0.5)',
                  borderColor: 'rgba(255, 99, 132, 1)',
                  borderWidth: 1
                }
              ]
            },
            pie: {
              labels: ['Producto A', 'Producto B', 'Producto C', 'Producto D'],
              datasets: [
                {
                  data: [30, 50, 20, 10],
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                  ],
                  borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                  ],
                  borderWidth: 1
                }
              ]
            },
            doughnut: {
              labels: ['Activos', 'Inactivos', 'Pendientes'],
              datasets: [
                {
                  data: [65, 25, 10],
                  backgroundColor: [
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(255, 206, 86, 0.7)'
                  ],
                  borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)'
                  ],
                  borderWidth: 1
                }
              ]
            }
          };
          
          // Cargar gráfico
          const loadChart = async () => {
            // Verificar si Chart.js está cargado
            if (typeof Chart === 'undefined') {
              // Cargar Chart.js si no está disponible
              return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
                script.onload = resolve;
                document.head.appendChild(script);
              }).then(initializeChart);
            } else {
              return initializeChart();
            }
          };
          
          // Inicializar gráfico
          const initializeChart = async () => {
            const chartType = props.chartType || 'line';
            const showLegend = props.showLegend !== undefined ? props.showLegend : true;
            const title = props.title || 'Gráfico de datos';
            
            // Obtener datos
            let chartData;
            if (props.dataSource === 'api' && props.apiEndpoint) {
              try {
                const response = await fetch(props.apiEndpoint);
                if (!response.ok) {
                  throw new Error('Error al cargar los datos de la API');
                }
                chartData = await response.json();
              } catch (error) {
                console.error('Error al cargar datos de la API:', error);
                chartData = SAMPLE_DATA[chartType]; // Fallback a datos de muestra
              }
            } else {
              chartData = SAMPLE_DATA[chartType];
            }
            
            // Obtener el canvas
            const canvas = el.querySelector('canvas');
            if (!canvas) return;
            
            // Destruir gráfico existente si hay uno
            const chartInstance = canvas.chart;
            if (chartInstance) {
              chartInstance.destroy();
            }
            
            // Crear nuevo gráfico
            const ctx = canvas.getContext('2d');
            
            // Configurar opciones según el tipo de gráfico
            const options = {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: showLegend
                },
                title: {
                  display: true,
                  text: title,
                  font: {
                    size: 16
                  }
                }
              }
            };
            
            // Opciones específicas para tipos de gráficos
            if (chartType === 'line' || chartType === 'bar') {
              options.scales = {
                y: {
                  beginAtZero: true
                }
              };
            }
            
            // Crear el gráfico
            canvas.chart = new Chart(ctx, {
              type: chartType,
              data: chartData,
              options: options
            });
          };
          
          // Inicializar el gráfico al cargar
          loadChart();
        }
      }
    },
    view: defaultType.view
  });
  
  // Registrar el componente de dashboard
  domc.addType('business-dashboard', {
    model: {
      defaults: {
        ...defaultModel.prototype.defaults,
        droppable: true,
        attributes: { class: 'business-dashboard' },
        traits: [
          {
            type: 'text',
            name: 'title',
            label: 'Título del dashboard'
          },
          {
            type: 'select',
            name: 'layout',
            label: 'Disposición',
            options: [
              { id: '2-2-1', name: '2 filas, 2 tarjetas, 1 gráfico grande' },
              { id: '1-2-2', name: '1 fila, 2 tarjetas, 2 gráficos' },
              { id: '2-1-2', name: '2 filas, 1 gráfico principal, 2 complementarios' }
            ]
          },
          {
            type: 'checkbox',
            name: 'refreshable',
            label: 'Permitir actualización'
          },
          {
            type: 'number',
            name: 'refreshInterval',
            label: 'Intervalo de actualización (seg)',
            min: 30,
            max: 3600,
            value: 300
          }
        ],
        'script-props': ['title', 'layout', 'refreshable', 'refreshInterval'],
        script() {
          const props = this.props;
          const el = this.el;
          
          // Actualizar título
          if (props.title) {
            const titleEl = el.querySelector('.dashboard-title');
            if (titleEl) titleEl.textContent = props.title;
          }
          
          // Configurar actualización automática
          let refreshTimer;
          
          const setupRefresh = () => {
            // Limpiar timer existente
            if (refreshTimer) {
              clearInterval(refreshTimer);
            }
            
            // Si la actualización está activada, configurar el temporizador
            if (props.refreshable && props.refreshInterval) {
              const interval = Math.max(30, props.refreshInterval) * 1000; // mínimo 30 segundos
              
              refreshTimer = setInterval(() => {
                // Actualizar todos los gráficos del dashboard
                const charts = el.querySelectorAll('.business-chart canvas');
                charts.forEach(canvas => {
                  if (canvas.chart && typeof canvas.chart.update === 'function') {
                    canvas.chart.update();
                  }
                });
                
                // Mostrar notificación de actualización
                const notification = document.createElement('div');
                notification.className = 'dashboard-refresh-notification';
                notification.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Dashboard actualizado';
                notification.style.cssText = `
                  position: absolute;
                  top: 15px;
                  right: 15px;
                  background-color: rgba(0, 123, 255, 0.9);
                  color: white;
                  padding: 8px 15px;
                  border-radius: 4px;
                  font-size: 14px;
                  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                  z-index: 1000;
                  opacity: 0;
                  transition: opacity 0.3s ease;
                `;
                
                el.appendChild(notification);
                
                // Mostrar y ocultar la notificación
                setTimeout(() => {
                  notification.style.opacity = '1';
                }, 100);
                
                setTimeout(() => {
                  notification.style.opacity = '0';
                  setTimeout(() => {
                    el.removeChild(notification);
                  }, 300);
                }, 3000);
              }, interval);
            }
          };
          
          // Botón de actualización manual
          const setupRefreshButton = () => {
            const refreshBtn = el.querySelector('.dashboard-refresh-btn');
            if (refreshBtn) {
              refreshBtn.addEventListener('click', () => {
                // Actualizar todos los gráficos del dashboard
                const charts = el.querySelectorAll('.business-chart canvas');
                charts.forEach(canvas => {
                  if (canvas.chart && typeof canvas.chart.update === 'function') {
                    canvas.chart.update();
                  }
                });
                
                // Animación de giro para el icono
                const icon = refreshBtn.querySelector('i');
                if (icon) {
                  icon.classList.add('fa-spin');
                  setTimeout(() => {
                    icon.classList.remove('fa-spin');
                  }, 1000);
                }
              });
            }
          };
          
          // Inicializar
          setupRefresh();
          setupRefreshButton();
        }
      }
    },
    view: defaultType.view
  });

  // Añadir bloques para el dashboard
  editor.BlockManager.add('business-dashboard', {
    label: 'Dashboard',
    category: 'Negocios',
    attributes: { class: 'fa fa-tachometer-alt' },
    content: {
      type: 'business-dashboard',
      content: `
        <div class="card border mb-4">
          <div class="card-header bg-light d-flex justify-content-between align-items-center">
            <h5 class="dashboard-title mb-0">Dashboard Administrativo</h5>
            <button class="btn btn-sm btn-outline-primary dashboard-refresh-btn" title="Actualizar datos">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
          <div class="card-body">
            <!-- Tarjetas de estadísticas -->
            <div class="row mb-4">
              <div class="col-md-3">
                <div class="card h-100" data-gjs-type="business-stat-card">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <div class="stat-card-title text-muted mb-2">Usuarios</div>
                        <h4 class="stat-card-value mb-0">1,258</h4>
                        <div class="stat-card-trend small text-success">
                          <i class="fas fa-arrow-up me-1"></i>12.5%
                        </div>
                      </div>
                      <div class="stat-card-icon d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: #3498db; border-radius: 12px;">
                        <i class="fa fa-users text-white"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card h-100" data-gjs-type="business-stat-card">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <div class="stat-card-title text-muted mb-2">Ingresos</div>
                        <h4 class="stat-card-value mb-0">$48,290</h4>
                        <div class="stat-card-trend small text-success">
                          <i class="fas fa-arrow-up me-1"></i>8.2%
                        </div>
                      </div>
                      <div class="stat-card-icon d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: #2ecc71; border-radius: 12px;">
                        <i class="fa fa-dollar-sign text-white"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card h-100" data-gjs-type="business-stat-card">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <div class="stat-card-title text-muted mb-2">Órdenes</div>
                        <h4 class="stat-card-value mb-0">358</h4>
                        <div class="stat-card-trend small text-danger">
                          <i class="fas fa-arrow-down me-1"></i>3.1%
                        </div>
                      </div>
                      <div class="stat-card-icon d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: #e74c3c; border-radius: 12px;">
                        <i class="fa fa-shopping-cart text-white"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-3">
                <div class="card h-100" data-gjs-type="business-stat-card">
                  <div class="card-body p-3">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <div class="stat-card-title text-muted mb-2">Visitas</div>
                        <h4 class="stat-card-value mb-0">9,524</h4>
                        <div class="stat-card-trend small text-success">
                          <i class="fas fa-arrow-up me-1"></i>18.3%
                        </div>
                      </div>
                      <div class="stat-card-icon d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: #9b59b6; border-radius: 12px;">
                        <i class="fa fa-chart-line text-white"></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Gráficos -->
            <div class="row">
              <div class="col-md-8">
                <div class="card h-100" data-gjs-type="business-chart">
                  <div class="card-body">
                    <div style="height: 320px;">
                      <canvas></canvas>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-4">
                <div class="card h-100" data-gjs-type="business-chart">
                  <div class="card-body">
                    <div style="height: 320px;">
                      <canvas></canvas>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    }
  });
  
  // Añadir bloques individuales
  editor.BlockManager.add('business-stat-card', {
    label: 'Tarjeta Estadística',
    category: 'Negocios',
    attributes: { class: 'fa fa-square' },
    content: {
      type: 'business-stat-card',
      content: `
        <div class="card h-100">
          <div class="card-body p-3">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="stat-card-title text-muted mb-2">Métrica</div>
                <h4 class="stat-card-value mb-0">12,345</h4>
                <div class="stat-card-trend small text-success">
                  <i class="fas fa-arrow-up me-1"></i>10%
                </div>
              </div>
              <div class="stat-card-icon d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; background-color: #3498db; border-radius: 12px;">
                <i class="fa fa-chart-bar text-white"></i>
              </div>
            </div>
          </div>
        </div>
      `
    }
  });
  
  editor.BlockManager.add('business-chart', {
    label: 'Gráfico',
    category: 'Negocios',
    attributes: { class: 'fa fa-chart-pie' },
    content: {
      type: 'business-chart',
      content: `
        <div class="card h-100">
          <div class="card-body">
            <div style="height: 300px;">
              <canvas></canvas>
            </div>
          </div>
        </div>
      `
    }
  });
} 