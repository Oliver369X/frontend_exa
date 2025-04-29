/**
 * Clase base abstracta que define la interfaz común para todos los proveedores de LLM.
 * Inspirada en la arquitectura de Bolt.diy para permitir múltiples proveedores.
 */
export interface ProviderOptions {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateCodeOptions {
  projectId: string;
  previousMessages?: any[];
}

export abstract class BaseProvider {
  protected options: ProviderOptions;

  constructor(options: ProviderOptions) {
    this.options = options;
  }

  /**
   * Método abstracto para generar código que debe ser implementado por cada proveedor
   */
  abstract generateCode(prompt: string, options: GenerateCodeOptions): Promise<any>;

  /**
   * Método abstracto para verificar el estado del proveedor
   */
  abstract checkStatus(): Promise<{
    status: 'operational' | 'degraded' | 'outage';
    latency?: number;
    message?: string;
  }>;
}