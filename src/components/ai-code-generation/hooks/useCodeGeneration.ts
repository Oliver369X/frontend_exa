'use client';

import { useState, useEffect } from 'react';
import { GrapesJSParserService } from '../services/grapesjs-parser.service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

interface Provider {
  name: string;
  status: string;
}

// Declaración global para acceder a GrapesJS desde window
declare global {
  interface Window {
    grapesJsActions?: {
      getContent: () => Record<string, unknown>;
      getHtml: () => string;
      getCss: () => string;
      getJs: () => string;
      getAllPages?: () => Array<{id: string, name: string, html?: string, css?: string}>;
    };
  }
}

export function useCodeGeneration(projectId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProviderReady, setIsProviderReady] = useState(false);
  
  // Verificar el estado del proveedor al cargar
  useEffect(() => {
    const checkProviderStatus = async () => {
      try {
        const response = await fetch('/api/ai/status');
        const data = await response.json();
        
        const geminiProvider = data.providers.find(
          (p: Provider) => p.name === 'gemini'
        );
        
        setIsProviderReady(geminiProvider?.status === 'operational');
      } catch (error) {
        console.error('Error al verificar el estado del proveedor:', error);
        setIsProviderReady(false);
      }
    };
    
    checkProviderStatus();
  }, []);
  
  // Obtener el diseño actual de GrapesJS
  const fetchProjectDesign = async () => {
    try {
      // Obtener el contenido actual del editor GrapesJS
      if (typeof window !== 'undefined' && window.grapesJsActions) {
        // Múltiples formas de obtener el contenido
        if (window.grapesJsActions.getContent) {
          return window.grapesJsActions.getContent();
        } else {
          // Alternativa: reconstruir a partir de HTML/CSS/JS
          const html = window.grapesJsActions.getHtml?.() || '';
          const css = window.grapesJsActions.getCss?.() || '';
          const js = window.grapesJsActions.getJs?.() || '';
          
          return {
            html,
            css,
            js,
            components: [{
              type: 'root',
              content: html
            }]
          };
        }
      }
      
      // Si no se puede obtener desde el cliente, intentar con la API
      try {
        const response = await fetch(`/api/projects/${projectId}/design`);
        if (response.ok) {
          return await response.json();
        }
      } catch (apiError) {
        console.log('API no disponible para obtener diseño, usando diseño vacío', apiError);
      }
      
      // Si todo falla, devolver un diseño vacío en lugar de null
      console.log('No se pudo obtener diseño del proyecto, usando diseño vacío');
      return {
        html: '',
        css: '',
        js: '',
        components: []
      };
    } catch (error) {
      console.error('Error al obtener el diseño del proyecto:', error);
      return {
        html: '',
        css: '',
        js: '',
        components: []
      };
    }
  };
  
  // Función para enviar un mensaje y obtener respuesta
  const sendMessage = async (content: string, image?: File | null) => {
    if (isGenerating) return;
    
    // Preparar mensaje del usuario
    const userMessage: Message = { role: 'user', content };
    
    // Si hay imagen, procesarla
    if (image) {
      try {
        // Crear FormData para subir la imagen
        const formData = new FormData();
        formData.append('image', image);
        
        // Subir imagen al servidor
        const uploadResponse = await fetch('/api/ai/upload-image', {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const { imageUrl } = await uploadResponse.json();
          userMessage.imageUrl = imageUrl;
        }
      } catch (error) {
        console.error('Error al subir imagen:', error);
      }
    }
    
    // Agregar mensaje a la conversación
    setMessages(prev => [...prev, userMessage]);
    
    setIsGenerating(true);
    
    try {
      // Obtener el diseño actual
      const projectDesign = await fetchProjectDesign();
      const designData = projectDesign ? 
        GrapesJSParserService.extractProjectData(projectDesign) : 
        null;
      
      // Enviar solicitud a la API
      const response = await fetch('/api/ai/generate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          message: content,
          previousMessages: messages,
          designData, // Incluir datos del diseño
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error en la solicitud: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Agregar respuesta del asistente
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error al generar código:', error);
      
      // Agregar mensaje de error
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Lo siento, ocurrió un error al generar el código. Por favor, intenta nuevamente.',
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const executeTerminalCommand = async (command: string) => {
    try {
      // Ejecutar comando en terminal (mediante conexión a StackBlitz VM)
      const response = await fetch('/api/ai/execute-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, command })
      });
      
      if (!response.ok) {
        throw new Error(`Error ejecutando comando: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error ejecutando comando terminal:', error);
      return false;
    }
  };
  
  return {
    messages,
    sendMessage,
    isGenerating,
    isProviderReady,
    executeTerminalCommand,
  };
}