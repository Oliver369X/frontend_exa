import { Editor } from 'grapesjs';

/**
 * Componente de navegación empresarial para GrapesJS
 */
export default (editor: Editor) => {
  const domc = editor.DomComponents;
  
  // Registrar el componente de navegación
  domc.addType('business-navigation', {
    isComponent: (el) => el.tagName === 'NAV' && el.classList.contains('business-nav'),
    model: {
      defaults: {
        tagName: 'nav',
        attributes: { class: 'business-nav' },
        droppable: true,
        draggable: true,
        // Propiedades del componente
        traits: [
          {
            type: 'select',
            name: 'navStyle',
            label: 'Estilo',
            options: [
              { id: 'horizontal', name: 'Horizontal' },
              { id: 'vertical', name: 'Vertical' },
              { id: 'sidebar', name: 'Sidebar' }
            ],
            default: 'horizontal'
          },
          {
            type: 'checkbox',
            name: 'responsive',
            label: 'Responsivo'
          },
          {
            type: 'checkbox',
            name: 'sticky',
            label: 'Fijo al desplazar'
          },
          {
            type: 'color',
            name: 'bgColor',
            label: 'Color de fondo'
          },
          {
            type: 'checkbox',
            name: 'darkTheme',
            label: 'Tema oscuro'
          },
          {
            type: 'checkbox',
            name: 'showSearch',
            label: 'Mostrar búsqueda'
          }
        ],
        // Script para inicializar el componente en el navegador
        script: function() {
          const el = this as HTMLElement;
          const options = {
            navStyle: el.getAttribute('data-nav-style') || 'horizontal',
            responsive: el.getAttribute('data-responsive') === 'true',
            sticky: el.getAttribute('data-sticky') === 'true',
            bgColor: el.getAttribute('data-bg-color'),
            darkTheme: el.getAttribute('data-dark-theme') === 'true',
            showSearch: el.getAttribute('data-show-search') === 'true'
          };
          
          // Inicializar navegación
          function initNav() {
            // Aplicar estilos base
            el.style.width = '100%';
            el.style.zIndex = '1000';
            
            if (options.bgColor) {
              el.style.backgroundColor = options.bgColor;
            } else {
              el.style.backgroundColor = options.darkTheme ? '#343a40' : '#f8f9fa';
            }
            
            el.style.color = options.darkTheme ? '#ffffff' : '#212529';
            
            // Aplicar estilos según el tipo de navegación
            if (options.navStyle === 'horizontal') {
              el.classList.add('nav-horizontal');
              el.style.display = 'flex';
              el.style.flexDirection = 'row';
              el.style.alignItems = 'center';
              el.style.padding = '1rem 2rem';
            } else if (options.navStyle === 'vertical') {
              el.classList.add('nav-vertical');
              el.style.display = 'flex';
              el.style.flexDirection = 'column';
              el.style.padding = '2rem 1rem';
              el.style.height = '100%';
            } else if (options.navStyle === 'sidebar') {
              el.classList.add('nav-sidebar');
              el.style.display = 'flex';
              el.style.flexDirection = 'column';
              el.style.padding = '2rem 1rem';
              el.style.height = '100vh';
              el.style.width = '280px';
              el.style.position = 'fixed';
              el.style.left = '0';
              el.style.top = '0';
              
              // Añadir el botón hamburguesa para móviles
              if (options.responsive) {
                const toggleBtn = document.createElement('button');
                toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
                toggleBtn.classList.add('nav-toggle-btn');
                toggleBtn.style.position = 'fixed';
                toggleBtn.style.top = '1rem';
                toggleBtn.style.left = '1rem';
                toggleBtn.style.zIndex = '1001';
                toggleBtn.style.display = 'none';
                toggleBtn.style.padding = '0.5rem';
                toggleBtn.style.backgroundColor = options.darkTheme ? '#343a40' : '#f8f9fa';
                toggleBtn.style.color = options.darkTheme ? '#ffffff' : '#212529';
                toggleBtn.style.border = 'none';
                toggleBtn.style.borderRadius = '4px';
                toggleBtn.style.cursor = 'pointer';
                
                document.body.appendChild(toggleBtn);
                
                toggleBtn.addEventListener('click', function() {
                  if (el.style.transform === 'translateX(-280px)') {
                    el.style.transform = 'translateX(0)';
                  } else {
                    el.style.transform = 'translateX(-280px)';
                  }
                });
                
                // Media query para mostrar/ocultar el botón y el sidebar
                const mediaQuery = window.matchMedia('(max-width: 768px)');
                
                function handleMediaChange(e) {
                  if (e.matches) {
                    toggleBtn.style.display = 'block';
                    el.style.transform = 'translateX(-280px)';
                  } else {
                    toggleBtn.style.display = 'none';
                    el.style.transform = 'translateX(0)';
                  }
                }
                
                mediaQuery.addListener(handleMediaChange);
                handleMediaChange(mediaQuery);
              }
            }
            
            // Aplicar navegación fija al desplazar
            if (options.sticky && options.navStyle !== 'sidebar') {
              el.style.position = 'sticky';
              el.style.top = '0';
            }
            
            // Añadir campo de búsqueda si está habilitado
            if (options.showSearch) {
              const searchContainer = document.createElement('div');
              searchContainer.classList.add('nav-search');
              searchContainer.style.marginLeft = 'auto';
              
              const searchInput = document.createElement('input');
              searchInput.type = 'text';
              searchInput.placeholder = 'Buscar...';
              searchInput.style.padding = '0.5rem';
              searchInput.style.borderRadius = '4px';
              searchInput.style.border = '1px solid #ced4da';
              
              const searchButton = document.createElement('button');
              searchButton.innerHTML = '<i class="fas fa-search"></i>';
              searchButton.style.marginLeft = '0.5rem';
              searchButton.style.padding = '0.5rem 1rem';
              searchButton.style.backgroundColor = options.darkTheme ? '#495057' : '#e9ecef';
              searchButton.style.color = options.darkTheme ? '#ffffff' : '#212529';
              searchButton.style.border = 'none';
              searchButton.style.borderRadius = '4px';
              searchButton.style.cursor = 'pointer';
              
              searchContainer.appendChild(searchInput);
              searchContainer.appendChild(searchButton);
              
              if (options.navStyle === 'horizontal') {
                el.appendChild(searchContainer);
              } else {
                el.prepend(searchContainer);
                searchContainer.style.marginBottom = '2rem';
                searchContainer.style.width = '100%';
              }
              
              // Funcionalidad de búsqueda
              searchButton.addEventListener('click', function() {
                console.log('Búsqueda:', searchInput.value);
                // Aquí se implementaría la lógica de búsqueda real
                alert('Búsqueda por: ' + searchInput.value);
              });
            }
            
            // Configurar los desplegables
            const dropdowns = el.querySelectorAll('.dropdown');
            dropdowns.forEach(dropdown => {
              const link = dropdown.querySelector('.dropdown-toggle');
              const menu = dropdown.querySelector('.dropdown-menu');
              
              if (link && menu) {
                link.addEventListener('click', function(e) {
                  e.preventDefault();
                  menu.classList.toggle('show');
                });
                
                // Cerrar el menú al hacer clic fuera
                document.addEventListener('click', function(e) {
                  if (!dropdown.contains(e.target as Node)) {
                    menu.classList.remove('show');
                  }
                });
              }
            });
            
            // Marcar enlace activo al hacer clic
            const navLinks = el.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
              link.addEventListener('click', function() {
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
              });
            });
          }
          
          // Inicializar
          initNav();
          
          // Actualizar al cambiar el tamaño de la ventana
          window.addEventListener('resize', initNav);
        },
        
        // Estilos específicos del componente
        style: `
          .business-nav {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            transition: all 0.3s ease;
          }
          
          .business-nav .nav-brand {
            font-size: 1.5rem;
            font-weight: bold;
            text-decoration: none;
            color: inherit;
          }
          
          .business-nav .nav-menu {
            display: flex;
            list-style: none;
            margin: 0;
            padding: 0;
          }
          
          .nav-horizontal .nav-menu {
            flex-direction: row;
            margin-left: 2rem;
          }
          
          .nav-vertical .nav-menu,
          .nav-sidebar .nav-menu {
            flex-direction: column;
            width: 100%;
          }
          
          .business-nav .nav-item {
            margin: 0;
          }
          
          .nav-horizontal .nav-item {
            margin-right: 1.5rem;
          }
          
          .nav-vertical .nav-item,
          .nav-sidebar .nav-item {
            margin-bottom: 1rem;
          }
          
          .business-nav .nav-link {
            text-decoration: none;
            color: inherit;
            font-weight: 500;
            transition: opacity 0.2s;
            display: block;
            padding: 0.5rem 0;
          }
          
          .business-nav .nav-link:hover {
            opacity: 0.8;
          }
          
          .business-nav .nav-link.active {
            font-weight: bold;
          }
          
          /* Estilos para desplegables */
          .business-nav .dropdown {
            position: relative;
          }
          
          .business-nav .dropdown-toggle {
            display: flex;
            align-items: center;
          }
          
          .business-nav .dropdown-toggle::after {
            content: '';
            display: inline-block;
            margin-left: 0.5rem;
            vertical-align: middle;
            border-top: 0.3em solid;
            border-right: 0.3em solid transparent;
            border-bottom: 0;
            border-left: 0.3em solid transparent;
          }
          
          .business-nav .dropdown-menu {
            display: none;
            position: absolute;
            background-color: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            border-radius: 4px;
            padding: 0.5rem 0;
            min-width: 10rem;
            z-index: 1000;
          }
          
          .nav-vertical .dropdown-menu,
          .nav-sidebar .dropdown-menu {
            position: static;
            width: 100%;
            box-shadow: none;
            padding-left: 1rem;
          }
          
          .business-nav .dropdown-menu.show {
            display: block;
          }
          
          .business-nav .dropdown-item {
            display: block;
            padding: 0.5rem 1rem;
            text-decoration: none;
            color: inherit;
          }
          
          .business-nav .dropdown-item:hover {
            background-color: rgba(0,0,0,0.05);
          }
          
          /* Estilos para responsive */
          @media (max-width: 768px) {
            .nav-horizontal {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .nav-horizontal .nav-menu {
              flex-direction: column;
              width: 100%;
              margin-left: 0;
              margin-top: 1rem;
            }
            
            .nav-horizontal .nav-item {
              margin-right: 0;
              margin-bottom: 0.5rem;
              width: 100%;
            }
            
            .nav-horizontal .nav-search {
              margin-left: 0;
              margin-top: 1rem;
              width: 100%;
            }
          }
        `
      }
    }
  });
  
  // Añadir bloques al BlockManager
  editor.BlockManager.add('business-navigation-horizontal', {
    label: 'Navegación Horizontal',
    category: 'Negocios',
    content: {
      type: 'business-navigation',
      attributes: {
        'data-nav-style': 'horizontal',
        'data-responsive': 'true',
        'data-sticky': 'true',
        'data-dark-theme': 'false',
        'data-show-search': 'true'
      },
      components: `
        <a href="#" class="nav-brand">Mi Empresa</a>
        <ul class="nav-menu">
          <li class="nav-item">
            <a href="#" class="nav-link active">Inicio</a>
          </li>
          <li class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle">Productos</a>
            <div class="dropdown-menu">
              <a href="#" class="dropdown-item">Categoría 1</a>
              <a href="#" class="dropdown-item">Categoría 2</a>
              <a href="#" class="dropdown-item">Categoría 3</a>
            </div>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">Servicios</a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">Clientes</a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">Contacto</a>
          </li>
        </ul>
      `
    }
  });
  
  editor.BlockManager.add('business-navigation-sidebar', {
    label: 'Navegación Sidebar',
    category: 'Negocios',
    content: {
      type: 'business-navigation',
      attributes: {
        'data-nav-style': 'sidebar',
        'data-responsive': 'true',
        'data-dark-theme': 'true',
        'data-show-search': 'true'
      },
      components: `
        <a href="#" class="nav-brand">Mi Empresa</a>
        <ul class="nav-menu">
          <li class="nav-item">
            <a href="#" class="nav-link active">Dashboard</a>
          </li>
          <li class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle">Ventas</a>
            <div class="dropdown-menu">
              <a href="#" class="dropdown-item">Pedidos</a>
              <a href="#" class="dropdown-item">Clientes</a>
              <a href="#" class="dropdown-item">Informes</a>
            </div>
          </li>
          <li class="nav-item dropdown">
            <a href="#" class="nav-link dropdown-toggle">Inventario</a>
            <div class="dropdown-menu">
              <a href="#" class="dropdown-item">Productos</a>
              <a href="#" class="dropdown-item">Categorías</a>
              <a href="#" class="dropdown-item">Proveedores</a>
            </div>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">Usuarios</a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link">Configuración</a>
          </li>
        </ul>
      `
    }
  });
  
  console.log('Componente de navegación empresarial registrado');
}; 