import React from 'react';

interface TabButtonProps {
  id?: string;
  onClick: () => void;
  active?: boolean;
  children?: React.ReactNode;
  panelId?: string;
  label?: string;
}

/**
 * Componente de botón para las pestañas del panel lateral
 */
export const TabButton: React.FC<TabButtonProps> = ({
  id,
  onClick,
  active = false,
  children,
  panelId,
  label,
}) => {
  // Usar el ID basado en panelId o el ID proporcionado directamente
  const buttonId = id || (panelId ? `tab-${panelId}` : undefined);
  
  return (
    <button
      id={buttonId}
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
      }`}
    >
      {children || label}
    </button>
  );
}; 