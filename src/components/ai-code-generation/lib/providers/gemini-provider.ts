import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseProvider, ProviderOptions, GenerateCodeOptions } from './base-provider';

export class GeminiProvider extends BaseProvider {
  private genAI: GoogleGenerativeAI;
  
  constructor(options: ProviderOptions) {
    super(options);
    this.genAI = new GoogleGenerativeAI(options.apiKey);
  }

  async generateCode(prompt: string, options: GenerateCodeOptions): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.options.model,
        generationConfig: {
          temperature: this.options.temperature || 0.7,
          maxOutputTokens: this.options.maxTokens || 8192,
        },
      });

      // Construir el historial de mensajes si existe
      const history = options.previousMessages || [];
      
      // Generar respuesta
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      return {
        text,
        model: this.options.model,
        usage: {
          promptTokens: 0, // Gemini no proporciona conteo de tokens directamente
          completionTokens: 0,
          totalTokens: 0,
        }
      };
    } catch (error) {
      console.error('Error en GeminiProvider:', error);
      throw error;
    }
  }

  async checkStatus(): Promise<{ status: 'operational' | 'degraded' | 'outage'; latency?: number; message?: string; }> {
    const startTime = Date.now();
    try {
      const model = this.genAI.getGenerativeModel({ model: this.options.model });
      await model.generateContent('Hola');
      const latency = Date.now() - startTime;
      
      return {
        status: 'operational',
        latency,
        message: 'Servicio operativo'
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        status: 'outage',
        latency,
        message: `Error: ${error.message}`
      };
    }
  }
}