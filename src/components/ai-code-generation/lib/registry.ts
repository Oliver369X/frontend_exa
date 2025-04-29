import { BaseProvider } from './providers/base-provider';
import { GeminiProvider } from './providers/gemini-provider';

// Tipo para el registro de proveedores
type ProviderRegistry = {
  [key: string]: typeof BaseProvider;
};

// Registro de proveedores disponibles
const providers: ProviderRegistry = {
  gemini: GeminiProvider,
  // Aquí puedes agregar más proveedores en el futuro
};

/**
 * Obtiene un proveedor del registro por su nombre
 */
export function getProvider(name: string): typeof BaseProvider | undefined {
  return providers[name.toLowerCase()];
}

/**
 * Obtiene todos los nombres de proveedores disponibles
 */
export function getProviderNames(): string[] {
  return Object.keys(providers);
}

/**
 * Registra un nuevo proveedor
 */
export function registerProvider(name: string, provider: typeof BaseProvider): void {
  providers[name.toLowerCase()] = provider;
}