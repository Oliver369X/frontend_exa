import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Inicializar la API de Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Tipo para el resultado del análisis
interface ImageAnalysisResult {
  description: string;
  tags: string[];
  dominantColors: string[];
  suggestedComponents: {
    type: string;
    attributes: Record<string, any>;
    content?: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Se requiere URL de imagen' },
        { status: 400 }
      );
    }

    // Obtener modelo 
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.0-pro-vision',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Prompt para el análisis
    const prompt = `
      Analiza la siguiente imagen y proporciona:
      
      1. Una descripción corta y precisa (máximo 10 palabras)
      2. Etiquetas relevantes (máximo 5)
      3. Colores dominantes en formato hexadecimal (máximo 3)
      4. Sugerencias de componentes HTML para integrarse con la imagen en un sitio web o aplicación Angular.
      
      Para los componentes, considera:
      - Título o encabezado que describa la imagen
      - Posible pie de foto o descripción
      - Elementos de interfaz que podrían acompañar a la imagen (botones, cajas de texto, etc.)
      - Layout y estructura para mostrar adecuadamente la imagen
      
      Responde únicamente en formato JSON con la siguiente estructura:
      {
        "description": "Descripción corta de la imagen",
        "tags": ["etiqueta1", "etiqueta2", "etiqueta3"],
        "dominantColors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
        "suggestedComponents": [
          {
            "type": "div|h1|p|button|etc",
            "attributes": {
              "class": "clases-css",
              "style": {
                "propiedad": "valor"
              }
            },
            "content": "Contenido del componente (si aplica)"
          }
        ]
      }
      
      Incluye componentes que tengan sentido para esta imagen específica, considerando su contenido y contexto visual.
    `;

    try {
      // Obtener imagen de la URL
      const imageResponse = await fetch(imageUrl);
      
      if (!imageResponse.ok) {
        throw new Error(`Error al obtener la imagen: ${imageResponse.statusText}`);
      }
      
      const imageData = await imageResponse.blob();
      
      // Convertir a formato base64 para enviar a Gemini
      const base64Image = await blobToBase64(imageData);
      
      // Preparar la entrada con la imagen
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: imageData.type,
            data: base64Image
          }
        }
      ]);
      
      const response = result.response;
      const text = response.text();
      
      // Intentar parsear como JSON
      let parsedResult: ImageAnalysisResult;
      
      try {
        // Buscar objeto JSON en la respuesta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No se pudo encontrar un objeto JSON válido en la respuesta');
        }
      } catch (parseError) {
        console.error('Error al parsear JSON:', parseError);
        // Proporcionar un resultado por defecto
        parsedResult = {
          description: "Imagen analizada",
          tags: ["imagen"],
          dominantColors: ["#cccccc"],
          suggestedComponents: [
            {
              type: "div",
              attributes: {
                class: "image-container",
                style: {
                  "display": "flex",
                  "flex-direction": "column",
                  "align-items": "center"
                }
              }
            },
            {
              type: "h3",
              attributes: {
                class: "image-title",
                style: {
                  "margin-top": "10px",
                  "font-size": "1.2rem"
                }
              },
              content: "Título de la imagen"
            }
          ]
        };
      }
      
      return NextResponse.json(parsedResult);
    } catch (error) {
      console.error('Error al analizar imagen con IA:', error);
      
      // Proporcionar un resultado básico si falla
      return NextResponse.json({
        description: "Imagen no analizada",
        tags: ["imagen", "importada"],
        dominantColors: ["#cccccc"],
        suggestedComponents: [
          {
            type: "image",
            attributes: {
              src: imageUrl,
              alt: "Imagen importada",
              style: {
                "max-width": "100%",
                "height": "auto"
              }
            }
          }
        ]
      });
    }
  } catch (error) {
    console.error('Error en la API de análisis de imagen:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de análisis de imagen' },
      { status: 500 }
    );
  }
}

// Función auxiliar para convertir Blob a Base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Extraer solo la parte base64 sin el prefijo (ej: data:image/jpeg;base64,)
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 