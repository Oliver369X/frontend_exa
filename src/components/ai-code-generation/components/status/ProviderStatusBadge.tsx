import { useProviderStatus } from '../../hooks/useProviderStatus';

interface ProviderStatusBadgeProps {
  providerName: string;
}

export function ProviderStatusBadge({ providerName }: ProviderStatusBadgeProps) {
  const { status, isLoading, error } = useProviderStatus(providerName);
  
  if (isLoading) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Verificando...
      </span>
    );
  }
  
  if (error || !status) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Error
      </span>
    );
  }
  
  const statusColors = {
    operational: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    outage: 'bg-red-100 text-red-800',
  };
  
  const statusText = {
    operational: 'Operativo',
    degraded: 'Degradado',
    outage: 'Inactivo',
  };
  
  const colorClass = statusColors[status.status as keyof typeof statusColors] || statusColors.outage;
  const text = statusText[status.status as keyof typeof statusText] || 'Desconocido';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {text}
      {status.latency && ` (${Math.round(status.latency)}ms)`}
    </span>
  );
}