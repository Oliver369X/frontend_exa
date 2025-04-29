// src/utils/stringUtils.ts

/**
 * Extrae el contenido de un archivo subido o de un string.
 * Si recibes un File, lo lee como texto.
 * Si recibes un string, lo retorna tal cual.
 */
export async function extractFileContent(input: File | string): Promise<string> {
  if (typeof input === 'string') {
    return input;
  }
  // Si es un File (en browser)
  if (input instanceof File) {
    return await input.text();
  }
  throw new Error('Tipo de entrada no soportado');
}