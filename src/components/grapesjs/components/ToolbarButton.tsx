import React from 'react';

interface ToolbarButtonProps {
  onClick: () => void;
  className?: string;
  active?: boolean;
  children?: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  id?: string;
  initialActive?: boolean;
}

/**
 * Componente de botón para la barra de herramientas
 */
export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  className = '',
  active = false,
  children,
  title,
  icon,
  id,
  initialActive,
}) => {
  // Si initialActive está presente, úsalo para determinar el estado activo
  const isActive = initialActive !== undefined ? initialActive : active;
  
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      title={title}
      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
        isActive 
          ? 'bg-blue-600 text-white border-blue-700'
          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
      } ${className}`}
    >
      {icon || children}
    </button>
  );
}; 