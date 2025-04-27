# Socket Communication Module

This module provides a robust solution for real-time communication with WebSockets using Socket.IO in a Next.js application.

## Features

- TypeScript support with proper type definitions
- Authentication integration with NextAuth.js
- React Context for global socket state management
- Custom hook for component-level socket access
- Connection management (connect, disconnect, reconnect)
- Event handling (emit, on, off)
- User presence tracking
- Error handling and notifications

## Components

### 1. `useSocket` Hook

A custom hook that provides low-level socket functionality:

- Socket connection management
- Event emission and listening
- Connection state tracking
- Error handling

### 2. `SocketProvider` Component

A React Context provider that:

- Wraps your application with socket functionality
- Manages authentication with NextAuth.js
- Provides high-level methods for common operations
- Tracks active users in collaboration sessions

## Usage Examples

### Setting Up the Provider

Wrap your application with the `SocketProvider` in your layout or top-level component:

```tsx
// app/layout.tsx
import { SocketProvider } from '@/components/socket';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

### Using the Context in Components

Access socket functionality in any component:

```tsx
// components/ProjectEditor.tsx
import { useSocketContext } from '@/components/socket';
import { useEffect } from 'react';

export default function ProjectEditor({ projectId }: { projectId: string }) {
  const { 
    joinProject, 
    leaveProject, 
    isConnected, 
    activeUsers, 
    emit, 
    on, 
    off 
  } = useSocketContext();
  
  // Join project when component mounts
  useEffect(() => {
    joinProject(projectId);
    
    // Set up event listeners
    on('editor:change', (data) => {
      console.log('Editor changed:', data);
    });
    
    // Clean up when component unmounts
    return () => {
      leaveProject();
      off('editor:change');
    };
  }, [projectId, joinProject, leaveProject, on, off]);
  
  // Send changes to server
  const handleEditorChange = (content: string) => {
    emit('editor:change', { 
      projectId, 
      content, 
      timestamp: Date.now() 
    });
  };
  
  return (
    <div>
      <div className="connection-status">
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
      
      <div className="active-users">
        <h3>Active Users ({activeUsers.length})</h3>
        <ul>
          {activeUsers.map(user => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      </div>
      
      {/* Your editor component */}
    </div>
  );
}
```

### Direct Hook Usage (Advanced)

For more control, you can use the `useSocket` hook directly:

```tsx
// components/CustomSocketComponent.tsx
import { useSocket } from '@/components/socket';
import { useEffect } from 'react';

export default function CustomSocketComponent() {
  const { 
    connect, 
    disconnect, 
    isConnected, 
    emit, 
    on, 
    off 
  } = useSocket();
  
  useEffect(() => {
    // Connect to a specific project
    connect('project-123');
    
    // Custom event handling
    on('custom-event', (data) => {
      console.log('Custom event received:', data);
    });
    
    return () => {
      disconnect();
      off('custom-event');
    };
  }, [connect, disconnect, on, off]);
  
  return (
    <div>
      <button onClick={() => emit('ping', { time: Date.now() })}>
        Send Ping
      </button>
    </div>
  );
}
```

## Error Handling

The module includes comprehensive error handling:

- Connection errors are captured and exposed
- Authentication failures are handled gracefully
- Disconnections are detected and can trigger reconnection
- Toast notifications for important events

## Security Considerations

- Authentication tokens are securely managed through NextAuth.js
- No sensitive information is stored in localStorage
- Connections are automatically terminated when sessions end
- Project access is verified on the server side

## Backend Integration

This module expects the backend to implement the following Socket.IO events:

- `user-join`: When a user joins a project
- `user-leave`: When a user leaves a project
- `presence-update`: To broadcast active users
- `editor:change`: For collaborative editing
- `chat:message`: For project chat functionality

## Performance Considerations

- Socket connections are lazy-loaded only when needed
- Event listeners are properly cleaned up to prevent memory leaks
- Reconnection is handled with exponential backoff

## Eventos del Socket

### Eventos de Colaboración

| Evento | Descripción | Datos |
| ------ | ----------- | ----- |
| `join:project` | Unirse a un proyecto | `{ projectId: string }` |
| `leave:project` | Salir de un proyecto | `{ projectId: string }` |
| `editor:update` | Actualización en el editor | `{ projectId: string, type: string, data: any }` |
| `editor:request-sync` | Solicitar sincronización completa | `{ projectId: string }` |
| `editor:full-update` | Enviar contenido completo | `{ projectId: string, data: GrapesJSData }` |

### Eventos de Páginas

| Evento | Descripción | Datos |
| ------ | ----------- | ----- |
| `page:request-sync` | Solicitar sincronización de páginas | `{ projectId: string }` |
| `page:full-sync` | Enviar todas las páginas | `{ projectId: string, pages: PageData[] }` |
| `page:add` | Agregar una nueva página | `{ projectId: string, pageId: string, pageName: string, pageData: PageData }` |
| `page:remove` | Eliminar una página | `{ projectId: string, pageId: string, pageName: string }` |
| `page:update` | Actualizar una página | `{ projectId: string, pageId: string, pageName: string, pageData: PageData }` |
| `page:select` | Seleccionar una página | `{ projectId: string, pageId: string, pageName: string }` |

## Tipos de Datos

```typescript
// GrapesJSData
interface GrapesJSData {
  components?: Record<string, unknown>;
  styles?: string;
}

// PageData
interface PageData {
  id: string;
  name: string;
  html?: string;
  css?: string;
  components?: Record<string, unknown>;
}

// PageEventData
type PageEventData = {
  pageId: string;
  pageName?: string;
  userId?: string;
  timestamp?: number;
  projectId?: string;
  pageData?: PageData;
};
```

## Flujo de Sincronización de Páginas

1. **Al unirse a un proyecto**:
   - El cliente emite `join:project`
   - El servidor reenvía `join:project` a todos en la sala
   - El cliente emite `page:request-sync`
   - El servidor reenvía `page:request-sync` a todos en la sala

2. **Propietario del proyecto responde**:
   - El propietario recibe `page:request-sync`
   - El propietario obtiene las páginas del localStorage
   - El propietario emite `page:full-sync` con todas las páginas
   - El servidor reenvía `page:full-sync` a todos en la sala

3. **Clientes reciben la sincronización**:
   - Los clientes reciben `page:full-sync`
   - Los clientes actualizan sus páginas locales según los datos recibidos

4. **Cambios en páginas**:
   - Al agregar página: `page:add`
   - Al eliminar página: `page:remove`
   - Al actualizar página: `page:update`
   - Al seleccionar página: `page:select`

## Depuración de Sincronización de Páginas

### Comprobación de Estado

Para verificar el estado del sistema de sincronización, puedes revisar los siguientes puntos:

1. **Comprobar conexión de Socket**:
   - Abrir la consola del navegador
   - Verificar si hay mensajes de conexión como `[Socket] Conectado al servidor...`
   - Verificar que no haya errores de conexión

2. **Comprobar configuración del proyecto**:
   - Verificar que `window.currentProjectId` esté configurado:
     ```js
     console.log(window.currentProjectId);
     ```
   - Verificar que `window.socketInstance` esté disponible:
     ```js
     console.log(window.socketInstance?.connected);
     ```

3. **Revisar localStorage**:
   - Verificar que las páginas se estén guardando:
     ```js
     console.log(JSON.parse(localStorage.getItem(`gjs-pages-${window.currentProjectId}`)));
     ```

### Solución de Problemas Comunes

1. **Las páginas no se sincronizan entre usuarios**:
   - Verificar que ambos usuarios estén en el mismo proyecto (mismo `projectId`)
   - Comprobar que el socket está conectado en ambos clientes
   - Revisar que no haya errores en la consola relacionados con socket

2. **Las páginas creadas no persisten después de recargar**:
   - Verificar que `projectId` está correctamente configurado
   - Comprobar que la función `savePages()` se está llamando al crear/modificar páginas
   - Revisar el localStorage para confirmar si las páginas se están guardando

3. **Problemas de ID de página duplicados**:
   - Los IDs de página deben ser únicos en todo el proyecto
   - Si ocurren errores de ID duplicado, reiniciar el proyecto y limpiar el localStorage

4. **Reiniciar desde cero**:
   Si los problemas persisten, puedes limpiar completamente el estado:
   ```js
   localStorage.removeItem(`gjs-pages-${window.currentProjectId}`);
   ```

### Consejos para Desarrollo y Pruebas

1. **Probar con múltiples pestañas**:
   - Abrir dos pestañas del navegador con el mismo proyecto
   - Una como propietario y otra como invitado
   - Verificar la sincronización en tiempo real

2. **Monitorear eventos de Socket**:
   - Agregar listeners temporales para ver todos los eventos:
     ```js
     window.socketInstance.onAny((event, ...args) => {
       console.log(`[Socket] Evento: ${event}`, args);
     });
     ```

3. **Verificar componentes de página**:
   - Inspeccionar el contenido de una página:
     ```js
     const editor = window.editor; // Si está disponible globalmente
     const currentPage = editor.Pages.getSelected();
     console.log({
       id: currentPage.get('id'),
       name: currentPage.get('name'),
       components: currentPage.getMainComponent().toJSON()
     });
     ```
