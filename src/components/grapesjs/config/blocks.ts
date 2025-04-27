import type { BlockProperties } from 'grapesjs';

// Configuración de bloques predefinidos para el editor

// Bloques básicos del editor
export const DEFAULT_BLOCKS: BlockProperties[] = [
  // Bloques básicos
  {
    id: 'section',
    label: 'Sección',
    category: 'Básicos',
    content: '<section class="container mx-auto p-4"><h2>Nueva Sección</h2><p>Contenido de la sección</p></section>',
    attributes: { class: 'block-section' }
  },
  {
    id: 'row',
    label: 'Fila',
    category: 'Básicos',
    content: '<div class="row d-flex"><div class="col"></div><div class="col"></div></div>',
    attributes: { class: 'block-row' }
  },
  
  // Formularios
  {
    id: 'form-complete',
    label: 'Formulario completo',
    category: 'Formularios',
    content: `
      <form class="p-4 border rounded">
        <div class="mb-3">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-control" placeholder="Ingrese su nombre">
        </div>
        <div class="mb-3">
          <label class="form-label">Email</label>
          <input type="email" class="form-control" placeholder="Ingrese su email">
        </div>
        <div class="mb-3">
          <label class="form-label">Mensaje</label>
          <textarea class="form-control" rows="3"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Enviar</button>
      </form>
    `,
    attributes: { class: 'block-form' }
  },
  
  // Tablas
  {
    id: 'data-table',
    label: 'Tabla de datos',
    category: 'Tablas',
    content: `
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Usuario 1</td>
              <td>usuario1@ejemplo.com</td>
              <td>
                <button class="btn btn-sm btn-primary">Editar</button>
                <button class="btn btn-sm btn-danger">Eliminar</button>
              </td>
            </tr>
            <tr>
              <td>2</td>
              <td>Usuario 2</td>
              <td>usuario2@ejemplo.com</td>
              <td>
                <button class="btn btn-sm btn-primary">Editar</button>
                <button class="btn btn-sm btn-danger">Eliminar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `,
    attributes: { class: 'block-table' }
  },
  
  // Tarjetas
  {
    id: 'card',
    label: 'Tarjeta',
    category: 'Componentes',
    content: `
      <div class="card" style="width: 18rem;">
        <img src="https://via.placeholder.com/300x200" class="card-img-top" alt="Imagen de tarjeta">
        <div class="card-body">
          <h5 class="card-title">Título de tarjeta</h5>
          <p class="card-text">Un ejemplo de texto rápido para construir sobre el título de la tarjeta y componer la mayor parte del contenido de la tarjeta.</p>
          <a href="#" class="btn btn-primary">Ver más</a>
        </div>
      </div>
    `,
    attributes: { class: 'block-card' }
  },
  
  // Navegación
  {
    id: 'navbar',
    label: 'Barra de navegación',
    category: 'Navegación',
    content: `
      <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container-fluid">
          <a class="navbar-brand" href="#">Logo</a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
              <li class="nav-item">
                <a class="nav-link active" href="#">Inicio</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">Características</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">Precios</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#">Contacto</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    `,
    attributes: { class: 'block-navbar' }
  },
  
  // Footer
  {
    id: 'footer',
    label: 'Pie de página',
    category: 'Navegación',
    content: `
      <footer class="bg-dark text-white py-4">
        <div class="container">
          <div class="row">
            <div class="col-md-4 mb-3 mb-md-0">
              <h5>Acerca de</h5>
              <p>Una breve descripción sobre la empresa o proyecto.</p>
            </div>
            <div class="col-md-4 mb-3 mb-md-0">
              <h5>Enlaces</h5>
              <ul class="list-unstyled">
                <li><a href="#" class="text-white">Inicio</a></li>
                <li><a href="#" class="text-white">Servicios</a></li>
                <li><a href="#" class="text-white">Contacto</a></li>
              </ul>
            </div>
            <div class="col-md-4">
              <h5>Contacto</h5>
              <address>
                <strong>Nombre de la empresa</strong><br>
                Calle Ejemplo 123<br>
                Ciudad, País<br>
                <a href="mailto:info@ejemplo.com" class="text-white">info@ejemplo.com</a>
              </address>
            </div>
          </div>
          <hr>
          <div class="text-center">
            <p class="mb-0">© 2023 Ejemplo. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    `,
    attributes: { class: 'block-footer' }
  }
]; 