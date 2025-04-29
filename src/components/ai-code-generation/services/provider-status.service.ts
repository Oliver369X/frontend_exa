/**
 * Servicio para monitorear el estado de los proveedores de IA
 */
export class ProviderStatusService {
  /**
   * Obtiene el estado de todos los proveedores disponibles
   */
  static async getProvidersStatus() {
    try {
      const response = await fetch('/api/ai/status');
      
      if (!response.ok) {
        throw new Error(`Error al obtener el estado de los proveedores: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error en ProviderStatusService:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene el estado de un proveedor específico
   */
  static async getProviderStatus(providerName: string) {
    try {
      const { providers } = await this.getProvidersStatus();
      return providers.find((p: any) => p.name.toLowerCase() === providerName.toLowerCase());
    } catch (error) {
      console.error(`Error al obtener el estado del proveedor ${providerName}:`, error);
      throw error;
    }
  }
}