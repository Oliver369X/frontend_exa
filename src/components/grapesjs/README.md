# GrapesJS Components

Este directorio contiene los componentes GrapesJS personalizados para el editor de arrastrar y soltar.

## Estructura de Directorios

- `blocks/`: Bloques reutilizables para GrapesJS
  - `business/`: Bloques orientados a negocios (tablas, formularios, navegación, etc.)
  - `enterprise/`: Bloques avanzados para aplicaciones empresariales
  - `index.ts`: Archivo central para exportar todos los bloques
- `plugins/`: Plugins de GrapesJS para funcionalidades adicionales
  - `businessBlocks.ts`: Plugin que registra los bloques de negocios
  - `enterpriseBlocks.ts`: Plugin que registra los bloques empresariales
  - `index.ts`: Archivo central para exportar todos los plugins
- `components/`: Componentes React usados dentro del editor
- `config/`: Configuraciones para el editor
- `utils/`: Utilidades y funciones auxiliares
- `types.ts`: Definiciones de tipos para TypeScript
- `simple-editor.tsx`: Componente principal del editor

## Bloques Disponibles

### Bloques de Negocios (`business/`)

- **DataTable**: Tablas de datos con funcionalidad de paginación, búsqueda y ordenamiento
- **Dashboard**: Paneles de control con gráficos y widgets
- **Form**: Formularios con validación y diferentes tipos de campos
- **Navigation**: Barras de navegación y menús

### Bloques Empresariales (`enterprise/`)

- **DataTable**: Tabla de datos avanzada con características empresariales
- **FormBuilder**: Constructor de formularios con opciones avanzadas

## Plugins

- **businessBlocks**: Registra los bloques de negocios en el editor
- **enterpriseBlocks**: Registra los bloques empresariales y configura categorías específicas

## Uso

Para usar estos componentes en un nuevo proyecto:

```tsx
import SimpleGrapesJSEditor from './components/grapesjs/simple-editor';

// En tu componente React
<SimpleGrapesJSEditor 
  initialContent={null} 
  onChange={(update) => console.log(update)}
  projectId="my-project"
/>
```

## Agregar Nuevos Bloques

Para agregar un nuevo bloque:

1. Crea un nuevo archivo en la carpeta apropiada (`blocks/business/` o `blocks/enterprise/`)
2. Implementa tu componente siguiendo el patrón existente
3. Importa y registra el bloque en el archivo `blocks/index.ts`

## Agregar Nuevos Plugins

Para agregar un nuevo plugin:

1. Crea un nuevo archivo en la carpeta `plugins/`
2. Implementa tu plugin siguiendo el patrón existente
3. Importa y registra el plugin en el archivo `plugins/index.ts` 