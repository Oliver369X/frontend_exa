'use client';

import React, { useState } from 'react';
import { Editor } from 'grapesjs';

interface ImportXmlModalProps {
  show: boolean;
  onHide: () => void;
  onImport: (components: any[]) => void;
  editorInstance: Editor;
}

const ImportXmlModal: React.FC<ImportXmlModalProps> = ({ 
  show, 
  onHide, 
  onImport, 
  editorInstance 
}) => {
  const [xml, setXml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  if (!show) return null;

  const handleImport = () => {
    if (!xml.trim()) {
      setError('Por favor, ingresa algún contenido XML');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Intentar analizar como HTML/XML
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/html');
      
      // Comprobar si hay errores en el parsing
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        throw new Error('Error al analizar el XML: formato incorrecto');
      }
      
      // Importar como componentes de GrapesJS
      const components = editorInstance.DomComponents.getWrapper().append(xml);
      
      // Notificar éxito
      onImport(Array.isArray(components) ? components : [components]);
      onHide();
    } catch (err) {
      console.error('Error al importar XML:', err);
      setError(err instanceof Error ? err.message : 'Error al importar el XML');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onHide}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Importar XML o HTML</h3>
          <button className="close-button" onClick={onHide}>×</button>
        </div>
        
        <div className="modal-body">
          <p className="modal-description">
            Pega el código HTML o XML que deseas importar al editor.
          </p>
          
          <textarea
            value={xml}
            onChange={e => setXml(e.target.value)}
            placeholder="<div>Tu código HTML o XML aquí</div>"
            rows={10}
            className="xml-textarea"
          />
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="cancel-button" 
            onClick={onHide}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button 
            className="import-button" 
            onClick={handleImport}
            disabled={isLoading}
          >
            {isLoading ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 4px;
          width: 600px;
          max-width: 90%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #eee;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        
        .modal-body {
          padding: 16px;
          overflow-y: auto;
          flex: 1;
        }
        
        .modal-description {
          margin-bottom: 16px;
          color: #555;
        }
        
        .xml-textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: monospace;
          resize: vertical;
        }
        
        .error-message {
          margin-top: 8px;
          color: #e53935;
          font-size: 14px;
        }
        
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 16px;
          border-top: 1px solid #eee;
          gap: 8px;
        }
        
        .cancel-button, .import-button {
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .cancel-button {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          color: #333;
        }
        
        .import-button {
          background-color: #4285f4;
          border: 1px solid #4285f4;
          color: white;
        }
        
        .cancel-button:hover {
          background-color: #eee;
        }
        
        .import-button:hover {
          background-color: #3367d6;
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default ImportXmlModal; 