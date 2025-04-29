import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Asegurar que el directorio de uploads existe
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    // Procesar el form data
    const formData = await request.formData();
    const projectId = formData.get('projectId') as string;

    // Obtener el archivo de imagen
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No se ha proporcionado ninguna imagen'
      }, { status: 400 });
    }

    // Validar que es una imagen
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Tipo de archivo no soportado. Por favor, sube una imagen en formato JPEG, PNG, GIF, SVG o WebP.'
      }, { status: 400 });
    }

    // Crear un nombre de archivo único
    const buffer = await file.arrayBuffer();
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // Si hay projectId, crear una carpeta específica para el proyecto
    let filePath = '';
    let fileUrl = '';
    
    if (projectId) {
      const projectDir = path.join(uploadsDir, projectId);
      if (!existsSync(projectDir)) {
        await mkdir(projectDir, { recursive: true });
      }
      filePath = path.join(projectDir, fileName);
      fileUrl = `/uploads/${projectId}/${fileName}`;
    } else {
      filePath = path.join(uploadsDir, fileName);
      fileUrl = `/uploads/${fileName}`;
    }

    // Guardar el archivo
    await writeFile(filePath, Buffer.from(buffer));
    
    // Retornar la URL del archivo
    return NextResponse.json({
      success: true,
      id: uuidv4(),
      url: fileUrl,
      filename: file.name
    });
  } catch (error) {
    console.error('Error en la subida de imagen:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al procesar la imagen'
    }, { status: 500 });
  }
}

// Configuración para Next.js para aceptar archivos grandes
export const config = {
  api: {
    bodyParser: false,
  },
}; 