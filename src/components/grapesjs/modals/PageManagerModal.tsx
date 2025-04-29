'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Table, Spinner, InputGroup } from 'react-bootstrap';
import { Editor } from 'grapesjs';
import { FaEye, FaEdit, FaTrash, FaCheck, FaTimes, FaPlus } from 'react-icons/fa';

interface Page {
  id: string;
  name: string;
  isActive: boolean;
}

interface PageManagerModalProps {
  show: boolean;
  onHide: () => void;
  editor: Editor | null;
  projectId: string;
}

const PageManagerModal: React.FC<PageManagerModalProps> = ({ show, onHide, editor, projectId }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newPageName, setNewPageName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState<string>('');

  // Cargar páginas cuando se abre el modal
  useEffect(() => {
    if (show && editor) {
      loadPages();
    }
  }, [show, editor]);

  const loadPages = async () => {
    if (!editor) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      // Obtener páginas del editor de GrapesJS
      const pageManager = editor.Pages;
      if (!pageManager) {
        throw new Error('Page Manager no disponible');
      }
      
      const pagesFromEditor = pageManager.getAll().map(page => ({
        id: page.id,
        name: page.name,
        isActive: pageManager.getActive().id === page.id
      }));
      
      setPages(pagesFromEditor);
    } catch (error) {
      console.error('Error al cargar páginas:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al cargar páginas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPage = async () => {
    if (!editor || !newPageName.trim()) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const pageManager = editor.Pages;
      if (!pageManager) {
        throw new Error('Page Manager no disponible');
      }
      
      // Comprobar si ya existe una página con ese nombre
      const existingPage = pageManager.getAll().find(p => p.name === newPageName.trim());
      if (existingPage) {
        throw new Error(`Ya existe una página con el nombre "${newPageName}"`);
      }
      
      // Añadir nueva página
      const newPage = pageManager.add({
        name: newPageName.trim(),
        component: `<div class="container-fluid"></div>`
      });
      
      // Guardar proyecto con la nueva página (si es necesario)
      editor.store();
      
      // Actualizar la lista de páginas
      await loadPages();
      
      // Limpiar el campo de entrada
      setNewPageName('');
    } catch (error) {
      console.error('Error al añadir página:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al añadir página');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePage = async (pageId: string) => {
    if (!editor) return;
    
    // No permitir eliminar la única página
    if (pages.length <= 1) {
      setErrorMessage('No se puede eliminar la única página del proyecto');
      return;
    }
    
    // No permitir eliminar la página activa sin cambiar primero
    const isActive = pages.find(p => p.id === pageId)?.isActive;
    if (isActive) {
      setErrorMessage('No se puede eliminar la página activa. Cambie a otra página primero.');
      return;
    }
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta página? Esta acción no se puede deshacer.')) {
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const pageManager = editor.Pages;
      if (!pageManager) {
        throw new Error('Page Manager no disponible');
      }
      
      // Eliminar la página
      pageManager.remove(pageId);
      
      // Guardar proyecto con la página eliminada
      editor.store();
      
      // Actualizar la lista de páginas
      await loadPages();
    } catch (error) {
      console.error('Error al eliminar página:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al eliminar página');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPage = async (pageId: string) => {
    if (!editor) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const pageManager = editor.Pages;
      if (!pageManager) {
        throw new Error('Page Manager no disponible');
      }
      
      // Cambiar a la página seleccionada
      pageManager.select(pageId);
      
      // Actualizar la lista de páginas
      await loadPages();
    } catch (error) {
      console.error('Error al seleccionar página:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al seleccionar página');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingPage = (page: Page) => {
    setEditingPageId(page.id);
    setEditingPageName(page.name);
  };

  const cancelEditingPage = () => {
    setEditingPageId(null);
    setEditingPageName('');
  };

  const savePageName = async () => {
    if (!editor || !editingPageId || !editingPageName.trim()) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const pageManager = editor.Pages;
      if (!pageManager) {
        throw new Error('Page Manager no disponible');
      }
      
      // Comprobar si ya existe una página con ese nombre
      const existingPage = pageManager.getAll().find(p => p.name === editingPageName.trim() && p.id !== editingPageId);
      if (existingPage) {
        throw new Error(`Ya existe una página con el nombre "${editingPageName}"`);
      }
      
      // Obtener la página a editar
      const page = pageManager.get(editingPageId);
      if (!page) {
        throw new Error('Página no encontrada');
      }
      
      // Actualizar el nombre de la página
      page.name = editingPageName.trim();
      
      // Guardar proyecto con el nombre actualizado
      editor.store();
      
      // Actualizar la lista de páginas
      await loadPages();
      
      // Salir del modo edición
      cancelEditingPage();
    } catch (error) {
      console.error('Error al actualizar nombre de página:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al actualizar nombre de página');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Gestor de Páginas</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading && (
          <div className="text-center my-3">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
          </div>
        )}
        
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}
        
        <h5>Añadir nueva página</h5>
        <Form className="mb-4">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Nombre de la nueva página"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              disabled={isLoading}
            />
            <Button 
              variant="primary" 
              onClick={handleAddPage}
              disabled={!newPageName.trim() || isLoading}
            >
              <FaPlus className="me-1" /> Añadir Página
            </Button>
          </InputGroup>
        </Form>
        
        <h5>Páginas existentes</h5>
        {pages.length === 0 ? (
          <p className="text-muted">No hay páginas disponibles</p>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(page => (
                <tr key={page.id}>
                  <td>
                    {editingPageId === page.id ? (
                      <Form.Control
                        type="text"
                        value={editingPageName}
                        onChange={(e) => setEditingPageName(e.target.value)}
                        disabled={isLoading}
                      />
                    ) : (
                      page.name
                    )}
                  </td>
                  <td>
                    {page.isActive ? (
                      <span className="text-success">Activa</span>
                    ) : (
                      <span className="text-muted">Inactiva</span>
                    )}
                  </td>
                  <td>
                    {editingPageId === page.id ? (
                      <>
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="me-1"
                          onClick={savePageName}
                          disabled={!editingPageName.trim() || isLoading}
                        >
                          <FaCheck />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={cancelEditingPage}
                          disabled={isLoading}
                        >
                          <FaTimes />
                        </Button>
                      </>
                    ) : (
                      <>
                        {!page.isActive && (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="me-1"
                            onClick={() => handleSelectPage(page.id)}
                            disabled={isLoading}
                            title="Ver esta página"
                          >
                            <FaEye />
                          </Button>
                        )}
                        <Button 
                          variant="info" 
                          size="sm" 
                          className="me-1"
                          onClick={() => startEditingPage(page)}
                          disabled={isLoading}
                          title="Editar nombre"
                        >
                          <FaEdit />
                        </Button>
                        {!page.isActive && (
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleRemovePage(page.id)}
                            disabled={isLoading || pages.length <= 1}
                            title="Eliminar página"
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PageManagerModal; 