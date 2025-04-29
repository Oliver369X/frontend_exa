// Centraliza la configuración de URLs del backend y WebSocket para el frontend
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000',
  socketPath: process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io/collab',
};

export const getApiUrl = (path: string) => `${API_CONFIG.baseUrl}${path}`;
export const getWsUrl = () => API_CONFIG.wsUrl;
