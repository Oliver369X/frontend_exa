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
