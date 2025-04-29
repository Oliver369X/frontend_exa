import { BaseProvider, ProviderOptions } from './providers/base-provider';
import { getProvider } from './registry';

/**
 * Gestor que facilita la selección y uso de proveedores específicos
 */
export class LLMManager {
  /**
   * Crea una instancia de un proveedor específico
   */
  static createProvider(name: string, options: ProviderOptions): BaseProvider {
    const Provider = getProvider(name);
    
    if (!Provider) {
      throw new Error(`Proveedor "${name}" no encontrado`);
    }
    
    return new Provider(options);
  }
  
  /**
   * Obtiene el proveedor predeterminado basado en la configuración
   */
  static async getDefaultProvider(): Promise<{
    provider: BaseProvider;
    name: string;
  }> {
    try {
      // Obtener configuración del endpoint
      const response = await fetch('/api/ai/config');
      const config = await response.json();
      
      if (!config.apiKey) {
        throw new Error('API key no configurada');
      }
      
      // Por defecto, usar Gemini
      const providerName = 'gemini';
      const provider = LLMManager.createProvider(providerName, {
        apiKey: config.apiKey,
        model: config.model || 'gemini-2.5-pro-preview-03-25',
        temperature: 0.7,
        maxTokens: 8192,
      });
      
      return {
        provider,
        name: providerName
      };
    } catch (error) {
      console.error('Error al obtener el proveedor predeterminado:', error);
      throw error;
    }
  }
}