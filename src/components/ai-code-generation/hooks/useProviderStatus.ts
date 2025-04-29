import { useState, useEffect } from 'react';
import { ProviderStatusService } from '../services/provider-status.service';

export function useProviderStatus(providerName?: string) {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (providerName) {
          const providerStatus = await ProviderStatusService.getProviderStatus(providerName);
          setStatus(providerStatus);
        } else {
          const { providers } = await ProviderStatusService.getProvidersStatus();
          setStatus(providers);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStatus();
    
    // Actualizar el estado cada 5 minutos
    const intervalId = setInterval(fetchStatus, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [providerName]);
  
  return { status, isLoading, error };
}