"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Editor } from 'grapesjs';
import Image from 'next/image';

interface ImportModalProps {
  editor: Editor;
  onClose: () => void;
}

type TabType = 'image' | 'xml';

const ImportModal: React.FC<ImportModalProps> = ({ editor, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const resetState = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    resetState();
  };
  
  const validateFile = (file: File): boolean => {
    setError(null);
    
    if (activeTab === 'image') {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        setError('El archivo seleccionado no es una imagen válida. Formatos permitidos: JPG, PNG, GIF, SVG.');
        return false;
      }
      
      // Tamaño máximo: 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen es demasiado grande. El tamaño máximo permitido es 5MB.');
        return false;
      }
    } else if (activeTab === 'xml') {
      if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
        setError('El archivo seleccionado no es un XML válido.');
        return false;
      }
      
      // Tamaño máximo: 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo XML es demasiado grande. El tamaño máximo permitido es 10MB.');
        return false;
      }
    }
    
    return true;
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!validateFile(file)) return;
    
    setSelectedFile(file);
    
    if (activeTab === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!validateFile(file)) return;
    
    setSelectedFile(file);
    
    if (activeTab === 'image') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const processImage = async () => {
    if (!selectedFile || !editor) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Primero, subimos la imagen al servidor
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }
      
      const data = await response.json();
      const imageUrl = data.url;
      
      // Creamos un componente de imagen en el editor
      const imageComponent = editor.DomComponents.addComponent({
        type: 'image',
        attributes: {
          src: imageUrl,
          alt: selectedFile.name.split('.')[0] || 'Imagen importada',
        },
        style: {
          'max-width': '100%',
        },
      });
      
      // Añadimos clases para que sea responsive
      imageComponent.addClass('img-fluid');
      
      // Centramos la vista en el componente
      editor.select(imageComponent);
      
      // Cerramos el modal
      onClose();
    } catch (err) {
      console.error('Error al procesar imagen:', err);
      setError('Error al procesar la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const processXml = async () => {
    if (!selectedFile || !editor) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Leemos el contenido del XML
      const reader = new FileReader();
      
      const xmlContent = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(selectedFile);
      });
      
      // Enviamos el XML a nuestra API para convertirlo usando IA
      const response = await fetch('/api/ai/convert-xml', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          xmlContent,
          fileName: selectedFile.name,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Error al convertir el XML');
      }
      
      const data = await response.json();
      
      if (data.components && Array.isArray(data.components)) {
        // Si la API devuelve un array de componentes, los añadimos al editor
        data.components.forEach((component: any) => {
          editor.DomComponents.addComponent(component);
        });
      } else if (data.html) {
        // Si la API devuelve HTML, lo añadimos como un componente
        editor.DomComponents.addComponent(data.html);
      } else if (data.pages && Array.isArray(data.pages)) {
        // Si la API devuelve un array de páginas, creamos una página nueva para cada una
        data.pages.forEach((page: any) => {
          const pageId = `page-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          // Guardamos la página actual
          const currentComponents = editor.getComponents();
          const currentStyles = editor.getStyle();
          const currentPage = editor.Pages.getSelected();
          
          if (currentPage) {
            currentPage.set('component', currentComponents);
            currentPage.set('style', currentStyles);
          }
          
          // Creamos la nueva página
          const newPage = editor.Pages.add({
            id: pageId,
            name: page.name || 'Página importada',
          });
          
          // Seleccionamos la nueva página
          editor.Pages.select(pageId);
          
          // Añadimos el contenido a la página
          if (page.html) {
            editor.setComponents(page.html);
          }
          
          if (page.css) {
            editor.setStyle(page.css);
          }
        });
        
        // Notificamos al usuario
        alert(`Se han importado ${data.pages.length} páginas desde el XML.`);
      } else {
        throw new Error('El formato de respuesta es inválido');
      }
      
      // Cerramos el modal
      onClose();
    } catch (err) {
      console.error('Error al procesar XML:', err);
      setError('Error al procesar el XML. Por favor, inténtalo de nuevo.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleImport = () => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo primero.');
      return;
    }
    
    if (activeTab === 'image') {
      processImage();
    } else {
      processXml();
    }
  };
  
  return (
    <div className="import-modal-overlay">
      <div className="import-modal-container">
        <div className="import-modal-header">
          <h3>Importar {activeTab === 'image' ? 'Imagen' : 'XML'}</h3>
          <button className="import-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="import-modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => changeTab('image')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M5,3A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3H5M19,19H5V5H19V19M10,12L7,15H17L13,10L10,12Z" />
            </svg>
            Imagen
          </button>
          <button 
            className={`tab-btn ${activeTab === 'xml' ? 'active' : ''}`}
            onClick={() => changeTab('xml')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="currentColor" d="M12.89,3L14.85,3.4L11.11,21L9.15,20.6L12.89,3M19.59,12L16,8.41V5.58L22.42,12L16,18.41V15.58L19.59,12M1.58,12L8,5.58V8.41L4.41,12L8,15.58V18.41L1.58,12Z" />
            </svg>
            XML
          </button>
        </div>
        
        <div className="import-modal-content">
          <div 
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={activeTab === 'image' ? 'image/*' : '.xml,text/xml'}
              className="file-input"
            />
            
            {!selectedFile ? (
              <div className="drop-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24">
                  <path fill="#aaa" d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                </svg>
                <p>Arrastra y suelta un archivo aquí<br />o <span className="browse-text">selecciona</span></p>
                <p className="file-type-hint">
                  {activeTab === 'image' 
                    ? 'Formatos permitidos: JPG, PNG, GIF, SVG (Max: 5MB)' 
                    : 'Formato: XML (Max: 10MB)'}
                </p>
              </div>
            ) : activeTab === 'image' && previewUrl ? (
              <div className="preview-container">
                <img 
                  src={previewUrl}
                  alt="Vista previa"
                  className="preview-image"
                />
                <div className="preview-info">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                </div>
                <button 
                  className="remove-file-btn"
                  onClick={resetState}
                  title="Eliminar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="file-selected">
                <svg width="36" height="36" viewBox="0 0 24 24">
                  <path fill="#4e88f1" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                <div className="file-info">
                  <span className="file-name">{selectedFile.name}</span>
                  <span className="file-size">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                </div>
                <button 
                  className="remove-file-btn"
                  onClick={resetState}
                  title="Eliminar"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {error && (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#d32f2f" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className="import-modal-footer">
          <button 
            className="cancel-btn" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancelar
          </button>
          <button 
            className="import-btn" 
            onClick={handleImport}
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="spinner-small"></div>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                </svg>
                <span>Importar</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .import-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100;
        }
        
        .import-modal-container {
          background-color: #fff;
          border-radius: 8px;
          width: 80%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        
        .import-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
        }
        
        .import-modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        
        .import-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #555;
        }
        
        .import-modal-tabs {
          display: flex;
          border-bottom: 1px solid #eee;
        }
        
        .tab-btn {
          flex: 1;
          padding: 12px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          font-size: 14px;
          font-weight: 500;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }
        
        .tab-btn.active {
          color: #4e88f1;
          border-bottom-color: #4e88f1;
        }
        
        .tab-btn:hover:not(.active) {
          background-color: #f9f9f9;
        }
        
        .import-modal-content {
          padding: 20px;
        }
        
        .drop-zone {
          position: relative;
          border: 2px dashed #ddd;
          border-radius: 6px;
          padding: 30px;
          text-align: center;
          transition: all 0.2s;
          cursor: pointer;
          min-height: 180px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .drop-zone:hover {
          border-color: #4e88f1;
        }
        
        .file-input {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        
        .drop-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #666;
        }
        
        .drop-placeholder p {
          margin: 10px 0 0;
        }
        
        .browse-text {
          color: #4e88f1;
          text-decoration: underline;
          cursor: pointer;
        }
        
        .file-type-hint {
          font-size: 12px;
          color: #888;
          margin-top: 10px !important;
        }
        
        .preview-container {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .preview-image {
          max-width: 100%;
          max-height: 200px;
          object-fit: contain;
          border-radius: 4px;
        }
        
        .preview-info {
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .file-selected {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 10px;
        }
        
        .file-info {
          margin-left: 10px;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }
        
        .file-name {
          font-weight: 500;
          color: #444;
          word-break: break-all;
        }
        
        .file-size {
          font-size: 12px;
          color: #888;
          margin-top: 2px;
        }
        
        .remove-file-btn {
          background: none;
          border: none;
          color: #888;
          padding: 5px;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .remove-file-btn:hover {
          color: #f44336;
        }
        
        .error-message {
          color: #d32f2f;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #ffebee;
          padding: 12px;
          border-radius: 4px;
          margin-top: 15px;
        }
        
        .import-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 15px 20px;
          border-top: 1px solid #eee;
        }
        
        .cancel-btn {
          padding: 8px 16px;
          background-color: #f0f0f0;
          border: none;
          border-radius: 4px;
          color: #444;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .cancel-btn:hover:not(:disabled) {
          background-color: #e0e0e0;
        }
        
        .import-btn {
          padding: 8px 16px;
          background-color: #4e88f1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s;
        }
        
        .import-btn:hover:not(:disabled) {
          background-color: #3a6dca;
        }
        
        .import-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ImportModal; 