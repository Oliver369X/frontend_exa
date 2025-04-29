import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { command, projectId } = await request.json();
    
    if (!command) {
      return NextResponse.json({ 
        success: false, 
        error: "El comando no puede estar vacío" 
      }, { status: 400 });
    }
    
    // Aquí solo registramos el comando - en la práctica real,
    // esta es una simulación ya que no podemos mantener una conexión directa
    // con el VM de StackBlitz entre solicitudes HTTP
    console.log(`[API] Comando para ejecutar en proyecto ${projectId}: ${command}`);
    
    // La ejecución real se hace desde el cliente
    return NextResponse.json({
      success: true,
      message: "Comando enviado para ejecución",
      command
    });
    
  } catch (error) {
    console.error('[API] Error al procesar comando:', error);
    return NextResponse.json({
      success: false,
      error: "Error al procesar el comando"
    }, { status: 500 });
  }
}
