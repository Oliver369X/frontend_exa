import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * API para convertir XML a componentes GrapesJS mediante IA
 */
export async function POST(request: NextRequest) {
  try {
    // Recibir el archivo XML del formulario
    const formData = await request.formData();
    const xmlFile = formData.get('xmlFile') as File;
    const projectId = formData.get('projectId') as string;

    if (!xmlFile) {
      return NextResponse.json(
        { error: 'No se recibió un archivo XML' },
        { status: 400 }
      );
    }

    // Leer el contenido del archivo
    const xmlContent = await xmlFile.text();
    
    // Guardar el archivo temporalmente para procesamiento (opcional)
    const tempDir = os.tmpdir();
    const filePath = path.join(tempDir, `xml-${projectId}-${Date.now()}.xml`);
    await writeFile(filePath, xmlContent);

    console.log(`[XML Processing] Archivo guardado en: ${filePath}`);
    console.log(`[XML Processing] Preparando procesamiento con IA`);

    // Aquí procesaríamos el XML con IA (Gemini, OpenAI, etc.)
    // Por ahora, generamos un componente básico a partir del XML para demostración
    
    // Extraer la estructura básica del XML para demostración
    const xmlStructure = extractStructureFromXML(xmlContent);
    
    // Generar componentes con estilo
    const { components, styles } = generateComponentsFromStructure(xmlStructure, xmlFile.name);

    return NextResponse.json({
      success: true,
      components,
      styles,
      message: 'Archivo XML procesado correctamente'
    });
  } catch (error) {
    console.error('[XML Processing] Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar el archivo XML' },
      { status: 500 }
    );
  }
}

/**
 * Extrae una estructura básica de un documento XML
 */
function extractStructureFromXML(xmlContent: string) {
  // Esta función debería usar un parser XML adecuado
  // Pero para demostración, usamos una extracción básica
  
  // Extraer etiquetas principales
  const rootTagMatch = xmlContent.match(/<([a-zA-Z0-9_:-]+)(?:\s|>)/);
  const rootTag = rootTagMatch ? rootTagMatch[1] : 'root';
  
  // Extraer algunos atributos del root si existen
  const attributesMatch = xmlContent.match(/<[^>]+\s+([^>]+)>/);
  const attributesStr = attributesMatch ? attributesMatch[1] : '';
  
  // Extraer nombres de elementos hijo
  const childTagsSet = new Set<string>();
  const childTagsMatches = xmlContent.matchAll(/<([a-zA-Z0-9_:-]+)(?:\s|>)/g);
  
  for (const match of childTagsMatches) {
    const tag = match[1];
    if (tag !== rootTag) {
      childTagsSet.add(tag);
    }
  }
  
  const childTags = Array.from(childTagsSet);
  
  return {
    rootTag,
    attributesStr,
    childTags,
    hasContent: xmlContent.length > 100 // Simplificación para demo
  };
}

/**
 * Genera componentes GrapesJS a partir de una estructura XML
 */
function generateComponentsFromStructure(structure: any, fileName: string) {
  // Generar un componente básico basado en la estructura
  const sectionTitle = fileName.replace('.xml', '').split('-').join(' ');
  
  // Componentes a crear basados en la estructura XML
  const components = `
<section class="xml-imported-section">
  <div class="container">
    <header class="xml-header">
      <h2>${sectionTitle}</h2>
      <div class="xml-metadata">
        <span class="xml-tag">Elemento raíz: ${structure.rootTag}</span>
        ${structure.childTags.length > 0 ? 
          `<div class="xml-children">
            <h4>Elementos encontrados:</h4>
            <ul>
              ${structure.childTags.slice(0, 5).map((tag: string) => 
                `<li>${tag}</li>`).join('')}
              ${structure.childTags.length > 5 ? '<li>...</li>' : ''}
            </ul>
          </div>` : ''}
      </div>
    </header>
    
    <div class="xml-content">
      <div class="xml-visual">
        <div class="node root-node">
          <div class="node-content">${structure.rootTag}</div>
          ${structure.childTags.slice(0, 3).map((tag: string) => 
            `<div class="node child-node">
              <div class="node-content">${tag}</div>
            </div>`).join('')}
          ${structure.childTags.length > 3 ? 
            `<div class="node child-node more-node">
              <div class="node-content">+ ${structure.childTags.length - 3} más</div>
            </div>` : ''}
        </div>
      </div>
      
      <div class="xml-info">
        <p>Este componente representa la estructura del archivo XML <strong>${fileName}</strong>.</p>
        <p>Para una integración completa, configura la transformación XML a Angular con IA.</p>
      </div>
    </div>
  </div>
</section>
  `;
  
  // Estilos CSS para el componente
  const styles = `
.xml-imported-section {
  padding: 30px 0;
  font-family: 'Arial', sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.xml-header {
  margin-bottom: 25px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 15px;
}

.xml-header h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 10px;
}

.xml-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.xml-tag {
  display: inline-block;
  background-color: #f0f4f8;
  padding: 5px 10px;
  border-radius: 4px;
  font-family: monospace;
}

.xml-children {
  flex-basis: 100%;
  margin-top: 10px;
}

.xml-children h4 {
  font-size: 16px;
  margin-bottom: 5px;
}

.xml-children ul {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 0;
}

.xml-children li {
  background-color: #e3f2fd;
  padding: 3px 8px;
  border-radius: 3px;
  font-family: monospace;
}

.xml-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-top: 20px;
}

.xml-visual {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node {
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  position: relative;
}

.root-node {
  background-color: #e8f5e9;
  padding: 20px;
  border: 2px solid #81c784;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.child-node {
  background-color: #e3f2fd;
  margin-top: 20px;
  border: 1px solid #64b5f6;
  width: 80%;
}

.more-node {
  background-color: #ffecb3;
  border: 1px dashed #ffa000;
}

.node-content {
  font-family: monospace;
  font-weight: bold;
}

.xml-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.xml-info p {
  margin-bottom: 15px;
  line-height: 1.6;
}
  `;
  
  return { components, styles };
} 