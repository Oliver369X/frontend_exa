import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Obtener la configuración del proveedor
    const config = {
      provider: 'gemini',
      model: process.env.GEMINI_MODEL || 'gemini-2.5-pro-preview-03-25',
      maxTokens: 8192,
      temperature: 0.7,
      features: {
        codeGeneration: true,
        imageGeneration: false,
        streaming: false,
      },
    };
    
    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error('Error al obtener la configuración:', error);
    
    return NextResponse.json(
      { error: 'Error al obtener la configuración' }, 
      { status: 500 }
    );
  }
}