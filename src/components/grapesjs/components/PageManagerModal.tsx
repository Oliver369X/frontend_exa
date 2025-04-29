"use client";

import React, { useState, useEffect } from 'react';
import { Editor } from 'grapesjs';

interface PageManagerModalProps {
  editor: Editor;
  projectId?: string;
  onClose: () => void;
}

interface Page {
  id: string;
  name: string;
  isSelected?: boolean;
}

const PageManagerModal: React.FC<PageManagerModalProps> = ({ editor, projectId, onClose }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadPages();
  }, [editor]);
  
  const loadPages = () => {
    if (!editor || !editor.Pages) {
      setError('Editor o módulo de páginas no disponible');
      setIsLoading(false);
      return;
    }
    
    try {
      // Obtener las páginas del editor
      const pagesCollection = editor.Pages.getAll();
      const selectedId = editor.Pages.getSelected()?.id;
      
      const pagesList = pagesCollection.map(page => ({
        id: page.id,
        name: page.get('name') || 'Sin nombre',
        isSelected: page.id === selectedId
      }));
      
      setPages(pagesList);
      setError(null);
    } catch (err) {
      console.error('Error al cargar páginas:', err);
      setError('Error al cargar las páginas del proyecto');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectPage = (pageId: string) => {
    if (!editor || !editor.Pages) return;
    
    try {
      // Guardar el contenido de la página actual antes de cambiar
      const currentComponents = editor.getComponents();
      const currentStyles = editor.getStyle();
      const currentPage = editor.Pages.getSelected();
      
      if (currentPage) {
        // Almacenar el estado actual de la página
        currentPage.set('component', currentComponents);
        currentPage.set('style', currentStyles);
      }
      
      // Seleccionar la nueva página
      editor.Pages.select(pageId);
      
      // Actualizar la lista local
      const updatedPages = pages.map(page => ({
        ...page,
        isSelected: page.id === pageId
      }));
      
      setPages(updatedPages);
      
      // Opcional: cerrar el modal después de seleccionar
      // onClose();
    } catch (err) {
      console.error('Error al seleccionar página:', err);
      setError('Error al cambiar a la página seleccionada');
    }
  };
  
  const startEditPage = (page: Page) => {
    setEditingId(page.id);
    setEditingName(page.name);
  };
  
  const savePageName = async () => {
    if (!editingId || !editor || !editor.Pages) return;
    
    try {
      const page = editor.Pages.get(editingId);
      if (page) {
        // Actualizar el nombre en la página
        page.set('name', editingName);
        
        // Si tenemos projectId, podemos actualizar en la base de datos
        if (projectId) {
          try {
            await fetch(`/api/projects/${projectId}/pages/${editingId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: editingName })
            });
          } catch (apiErr) {
            console.error('Error al guardar en API:', apiErr);
            // Continuamos aunque falle la API
          }
        }
        
        // Actualizar la lista local
        const updatedPages = pages.map(p => 
          p.id === editingId ? { ...p, name: editingName } : p
        );
        
        setPages(updatedPages);
        setEditingId(null);
        setEditingName('');
      }
    } catch (err) {
      console.error('Error al guardar nombre de página:', err);
      setError('Error al actualizar el nombre de la página');
    }
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };
  
  const deletePage = async (pageId: string) => {
    if (!editor || !editor.Pages) return;
    
    // No permitir eliminar si es la única página
    if (pages.length <= 1) {
      setError('No se puede eliminar la única página del proyecto');
      return;
    }
    
    // Confirmar eliminación
    if (!confirm('¿Estás seguro de que deseas eliminar esta página? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      // Si es la página seleccionada, seleccionar otra primero
      const isSelected = editor.Pages.getSelected()?.id === pageId;
      if (isSelected) {
        const otherPageId = pages.find(p => p.id !== pageId)?.id;
        if (otherPageId) {
          editor.Pages.select(otherPageId);
        }
      }
      
      // Eliminar la página
      editor.Pages.remove(pageId);
      
      // Si tenemos projectId, actualizar en la base de datos
      if (projectId) {
        try {
          await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
            method: 'DELETE'
          });
        } catch (apiErr) {
          console.error('Error al eliminar en API:', apiErr);
          // Continuamos aunque falle la API
        }
      }
      
      // Actualizar la lista local
      setPages(pages.filter(p => p.id !== pageId));
      
      // Si era la página que se estaba editando, cancelar edición
      if (editingId === pageId) {
        cancelEdit();
      }
    } catch (err) {
      console.error('Error al eliminar página:', err);
      setError('Error al eliminar la página');
    }
  };
  
  const addNewPage = async () => {
    if (!editor || !editor.Pages) return;
    
    try {
      // Crear una nueva página
      const newPageId = `page-${Date.now()}`;
      const newPage = editor.Pages.add({
        id: newPageId,
        name: 'Nueva Página'
      });
      
      // Si tenemos projectId, crear en la base de datos
      if (projectId) {
        try {
          await fetch(`/api/projects/${projectId}/pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              id: newPageId, 
              name: 'Nueva Página',
              content: '',
              styles: ''
            })
          });
        } catch (apiErr) {
          console.error('Error al crear en API:', apiErr);
          // Continuamos aunque falle la API
        }
      }
      
      // Actualizar la lista local
      setPages([
        ...pages,
        { 
          id: newPageId, 
          name: 'Nueva Página',
          isSelected: false
        }
      ]);
      
      // Opcional: seleccionar la nueva página automáticamente
      // editor.Pages.select(newPageId);
    } catch (err) {
      console.error('Error al crear nueva página:', err);
      setError('Error al crear nueva página');
    }
  };
  
  return (
    <div className="page-manager-modal-overlay">
      <div className="page-manager-modal-container">
        <div className="page-manager-modal-header">
          <h3>Administrar Páginas</h3>
          <button className="page-manager-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="page-manager-modal-content">
          {isLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Cargando páginas...</span>
            </div>
          ) : error ? (
            <div className="error-message">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#d32f2f" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
              <span>{error}</span>
            </div>
          ) : (
            <>
              {pages.length === 0 ? (
                <div className="no-pages-message">
                  <svg width="48" height="48" viewBox="0 0 24 24">
                    <path fill="#aaa" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M13,13V18H10V13H13Z" />
                  </svg>
                  <p>No hay páginas en este proyecto</p>
                </div>
              ) : (
                <ul className="pages-list">
                  {pages.map(page => (
                    <li 
                      key={page.id} 
                      className={`page-item ${page.isSelected ? 'selected' : ''}`}
                    >
                      <div className="page-info">
                        {editingId === page.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') savePageName();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="page-name-input"
                          />
                        ) : (
                          <span className="page-name">{page.name}</span>
                        )}
                        {page.isSelected && (
                          <span className="selected-badge">Actual</span>
                        )}
                      </div>
                      
                      <div className="page-actions">
                        {editingId === page.id ? (
                          <>
                            <button 
                              className="action-btn save-btn" 
                              onClick={savePageName}
                              title="Guardar"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                              </svg>
                            </button>
                            <button 
                              className="action-btn cancel-btn" 
                              onClick={cancelEdit}
                              title="Cancelar"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="action-btn view-btn" 
                              onClick={() => handleSelectPage(page.id)}
                              disabled={page.isSelected}
                              title="Ver página"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                              </svg>
                            </button>
                            <button 
                              className="action-btn edit-btn" 
                              onClick={() => startEditPage(page)}
                              title="Editar nombre"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z" />
                              </svg>
                            </button>
                            <button 
                              className="action-btn delete-btn" 
                              onClick={() => deletePage(page.id)}
                              disabled={pages.length <= 1}
                              title="Eliminar página"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              
              <div className="add-page-container">
                <button className="add-page-btn" onClick={addNewPage}>
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
                  </svg>
                  Añadir nueva página
                </button>
              </div>
            </>
          )}
        </div>
        
        <div className="page-manager-modal-footer">
          <button className="close-btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .page-manager-modal-overlay {
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
        
        .page-manager-modal-container {
          background-color: #fff;
          border-radius: 8px;
          width: 80%;
          max-width: 500px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        
        .page-manager-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
        }
        
        .page-manager-modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        
        .page-manager-modal-close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #555;
        }
        
        .page-manager-modal-content {
          padding: 20px;
          overflow-y: auto;
          flex-grow: 1;
          max-height: 60vh;
        }
        
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px;
          color: #666;
        }
        
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #4e88f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
          margin-bottom: 15px;
        }
        
        .no-pages-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px;
          color: #666;
          text-align: center;
        }
        
        .pages-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .page-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 15px;
          border-bottom: 1px solid #eee;
          transition: background-color 0.2s;
        }
        
        .page-item:last-child {
          border-bottom: none;
        }
        
        .page-item:hover {
          background-color: #f9f9f9;
        }
        
        .page-item.selected {
          background-color: #f5f9ff;
          border-left: 3px solid #4e88f1;
        }
        
        .page-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-grow: 1;
          max-width: 70%;
        }
        
        .page-name {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .selected-badge {
          background-color: #e3f2fd;
          color: #1976d2;
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 10px;
          font-weight: 500;
        }
        
        .page-name-input {
          padding: 5px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          width: 100%;
        }
        
        .page-actions {
          display: flex;
          gap: 5px;
        }
        
        .action-btn {
          background: none;
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #555;
          transition: all 0.2s;
        }
        
        .action-btn:hover:not(:disabled) {
          background-color: #f0f0f0;
        }
        
        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .view-btn:hover {
          color: #4e88f1;
        }
        
        .edit-btn:hover {
          color: #4caf50;
        }
        
        .delete-btn:hover:not(:disabled) {
          color: #f44336;
        }
        
        .save-btn {
          color: #4caf50;
        }
        
        .cancel-btn {
          color: #f44336;
        }
        
        .add-page-container {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }
        
        .add-page-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #f0f0f0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .add-page-btn:hover {
          background-color: #e0e0e0;
        }
        
        .page-manager-modal-footer {
          display: flex;
          justify-content: flex-end;
          padding: 15px 20px;
          border-top: 1px solid #eee;
        }
        
        .close-btn {
          padding: 8px 16px;
          background-color: #4e88f1;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .close-btn:hover {
          background-color: #3a6dca;
        }
      `}</style>
    </div>
  );
};

export default PageManagerModal; 