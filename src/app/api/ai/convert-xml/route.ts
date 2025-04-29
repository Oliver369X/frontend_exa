import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractFileContent } from "@/utils/stringUtils";

// Inicializar la API de Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { xmlContent, options } = body;

    if (!xmlContent) {
      return NextResponse.json(
        { error: 'Se requiere contenido XML' },
        { status: 400 }
      );
    }

    // Obtener modelo apropiado (usando el modelo estándar en lugar del Pro)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });

    // Crear instrucciones detalladas basadas en las opciones seleccionadas
    const instructions = `
      Como experto en desarrollo web, necesito que conviertas el XML proporcionado en HTML de alta calidad.
      
      REQUISITOS ESPECÍFICOS:
      ${options?.includeBootstrap ? '- Utiliza clases de Bootstrap 5 para mejorar la apariencia y funcionalidad.' : '- No utilices frameworks CSS externos.'}
      ${options?.responsiveDesign ? '- Implementa un diseño responsive que funcione bien en dispositivos móviles, tablets y desktop.' : ''}
      ${options?.preserveStructure ? '- Mantén la estructura semántica usando las etiquetas HTML5 apropiadas (header, nav, main, section, article, footer, etc.).' : ''}
      ${options?.optimizeForAngular ? '- Optimiza el código para ser compatible con Angular, usando atributos como [ngClass], (click), *ngIf, *ngFor cuando sea apropiado.' : ''}
      ${options?.convertForms ? '- Convierte los elementos de formulario con validación, labels asociados correctamente y estructura accesible.' : ''}
      
      ESTRUCTURA DE LA RESPUESTA:
      1. Devuelve SOLO el código HTML, sin explicaciones, comentarios ni texto adicional.
      2. El HTML debe estar formateado correctamente y listo para ser insertado en un editor de código.
      3. Asegúrate de que todas las etiquetas estén cerradas correctamente.
      4. Mantén intactos los IDs originales y añade clases descriptivas cuando sea necesario.
      
      ANÁLISIS DEL XML:
      - Primero analiza cuidadosamente la estructura del XML y sus atributos.
      - Identifica la jerarquía de elementos y sus relaciones.
      - Determina qué elementos se deben convertir a componentes Angular si es apropiado.
      - Convierte atributos XML a atributos HTML o directivas Angular según corresponda.
    `;

    // Prompt completo para el modelo
    const prompt = `${instructions}\n\nXML a convertir:\n${xmlContent}`;

    // Realizar la solicitud a Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extraer solo el contenido HTML si viene dentro de bloques de código
    let htmlContent = extractFileContent(text);
    
    // Si extractFileContent falló, intentar extraer HTML directamente
    if (!htmlContent) {
      htmlContent = extractHTML(text);
    }

    return NextResponse.json({
      htmlContent
    });
  } catch (error) {
    console.error('Error al convertir XML:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de conversión XML' },
      { status: 500 }
    );
  }
}

// Función auxiliar para extraer bloques de código HTML si el extractFileContent falla
function extractHTML(text: string): string {
  // Intentar extraer HTML de bloques de código markdown
  const codeBlockMatch = text.match(/```html\n([\s\S]*?)\n```/) || 
                         text.match(/```([\s\S]*?)```/);
  
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1];
  }
  
  // Intentar extraer HTML basado en etiquetas
  const htmlTagMatch = text.match(/<html[\s\S]*<\/html>/) || 
                      text.match(/<body[\s\S]*<\/body>/) ||
                      text.match(/<div[\s\S]*<\/div>/) ||
                      text.match(/<[^>]+>[\s\S]*<\/[^>]+>/);
  
  if (htmlTagMatch) {
    return htmlTagMatch[0];
  }
  
  // Si aún no hay coincidencia, devolver el texto completo
  return text;
}

// Función para extraer CSS de texto si no está correctamente formateado como JSON
function extractCSS(text: string): string {
  const cssMatch = text.match(/```css\n([\s\S]*?)\n```/) || 
                  text.match(/\.[\w-]+\s*\{[\s\S]*?\}/);
  
  if (cssMatch) {
    return cssMatch[1] || cssMatch[0];
  }
  
  return '';
} 