import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-pro-preview-03-25';
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          providers: [
            {
              name: 'gemini',
              status: 'outage',
              message: 'API key no configurada'
            }
          ] 
        }, 
        { status: 200 }
      );
    }
    
    // Verificar el estado de Gemini
    const startTime = Date.now();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Realizar una solicitud simple para verificar que la API funciona
    await model.generateContent('Hola');
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    return NextResponse.json(
      { 
        providers: [
          {
            name: 'gemini',
            status: 'operational',
            latency,
            message: 'API operativa'
          }
        ] 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al verificar el estado del proveedor:', error);
    
    return NextResponse.json(
      { 
        providers: [
          {
            name: 'gemini',
            status: 'outage',
            message: error instanceof Error ? error.message : 'Error desconocido'
          }
        ] 
      }, 
      { status: 200 }
    );
  }
}