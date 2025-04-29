import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { existsSync } from 'fs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json(
        { error: 'No se ha proporcionado una imagen' },
        { status: 400 }
      );
    }
    
    // Obtener buffer de la imagen
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Crear nombre único para la imagen
    const uniqueId = uuidv4();
    const imageExt = image.name.split('.').pop();
    const imageName = `${uniqueId}.${imageExt}`;
    
    // Definir ruta de guardado
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Crear la carpeta si no existe
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }
    
    const imagePath = join(uploadDir, imageName);
    
    // Guardar imagen
    await writeFile(imagePath, buffer);
    
    // Crear URL para acceder a la imagen
    const imageUrl = `/uploads/${imageName}`;
    
    return NextResponse.json({ 
      success: true,
      imageUrl,
      message: 'Imagen subida correctamente'
    });
    
  } catch (error) {
    console.error('Error al subir imagen:', error);
    
    return NextResponse.json(
      { error: 'Error al procesar la imagen' },
      { status: 500 }
    );
  }
}
