import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Prompt base mejorado para incluir datos de GrapesJS
const BASE_PROMPT = `
Eres un experto en desarrollo Angular. Tu tarea es generar código Angular de alta calidad basado en la descripción del usuario y el diseño visual proporcionado.

Sigue estas pautas:
1. Utiliza las mejores prácticas de Angular y TypeScript
2. Implementa una arquitectura modular y escalable
3. Incluye comentarios explicativos en el código
4. Proporciona instrucciones claras sobre cómo implementar el código
5. Cuando generes código, utiliza bloques de código con la siguiente sintaxis:
   \`\`\`typescript:ruta/al/archivo.ts
   // Código aquí
   \`\`\`
   \`\`\`html:ruta/al/archivo.html
   <!-- Código aquí -->
   \`\`\`
   \`\`\`scss:ruta/al/archivo.scss
   /* Código aquí */
   \`\`\`

Responde en español y asegúrate de que el código sea completo y funcional.
`;

export async function POST(request: Request) {
  try {
    const { projectId, message, previousMessages, designData } = await request.json();
    
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-pro-preview-03-25';
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key no configurada' }, 
        { status: 500 }
      );
    }
    
    // Inicializar el modelo de Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Construir el historial de mensajes para el contexto
    const chatHistory = previousMessages?.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })) || [];
    
    // Crear la sesión de chat
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      },
    });
    
    // Preparar el prompt con los datos del diseño
    let designPrompt = '';
    if (designData) {
      designPrompt = `
Diseño visual del proyecto:
- Componentes: ${JSON.stringify(designData.components.slice(0, 5))}
- Estructura: ${JSON.stringify(designData.structure)}
- Estilos: ${JSON.stringify(designData.styles.slice(0, 5))}

Usa esta información para generar código Angular que replique este diseño visual.
`;
    }
    
    const projectStructure = await getProjectStructureFromStackBlitz(projectId);
    
    // Mejorar prompt para incluir estructura existente
    const prompt = `
Proyecto Angular existente con estructura:
${JSON.stringify(projectStructure.files)}

Diseño GrapesJS:
${JSON.stringify(designData)}

Genera código compatible con esta estructura.
`;
    
    // Enviar el mensaje y obtener la respuesta
    const result = await chat.sendMessage(prompt);
    const response = result.response.text();
    
    return NextResponse.json({ response }, { status: 200 });
  } catch (error) {
    console.error('Error al generar código:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al generar código', 
        details: error instanceof Error ? error.message : 'Error desconocido' 
      }, 
      { status: 500 }
    );
  }
}