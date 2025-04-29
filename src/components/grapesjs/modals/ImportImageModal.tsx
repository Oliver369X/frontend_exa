'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Card, Row, Col, Badge, Toast, ToastContainer } from 'react-bootstrap';
import { Editor } from 'grapesjs';

interface ImportImageModalProps {
  show: boolean;
  onHide: () => void;
  editor: Editor | null;
  projectId: string;
}

interface UploadedImage {
  id: string;
  url: string;
  filename: string;
  selected: boolean;
}

const ImportImageModal: React.FC<ImportImageModalProps> = ({ show, onHide, editor, projectId }) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar imágenes existentes del proyecto al abrir el modal
  useEffect(() => {
    if (show && editor) {
      // Aquí se podría implementar una función para cargar imágenes existentes del proyecto
      // Por ahora dejamos un array vacío
      setUploadedImages([]);
    }
  }, [show, editor]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setErrorMessage('');

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        if (projectId) {
          formData.append('projectId', projectId);
        }

        const response = await fetch('/api/ai/upload-image', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al subir la imagen');
        }
        
        return {
          id: data.id,
          url: data.url,
          filename: data.filename,
          selected: false
        };
      });

      const newImages = await Promise.all(uploadPromises);
      setUploadedImages((prev) => [...prev, ...newImages]);
      
      // Mostrar mensaje de éxito
      setToastMessage(`${files.length} imagen(es) subida(s) correctamente`);
      setShowToast(true);
      
      // Limpiar input de archivos
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error al subir imágenes:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error desconocido al subir imágenes');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleImageSelection = (id: string) => {
    setUploadedImages(images => 
      images.map(img => 
        img.id === id ? { ...img, selected: !img.selected } : img
      )
    );
  };

  const selectAllImages = () => {
    setUploadedImages(images => 
      images.map(img => ({ ...img, selected: true }))
    );
  };

  const deselectAllImages = () => {
    setUploadedImages(images => 
      images.map(img => ({ ...img, selected: false }))
    );
  };

  const deleteSelectedImages = () => {
    const selectedCount = uploadedImages.filter(img => img.selected).length;
    if (selectedCount === 0) {
      setErrorMessage('No hay imágenes seleccionadas para eliminar');
      return;
    }
    
    setUploadedImages(images => 
      images.filter(img => !img.selected)
    );
    
    setToastMessage(`${selectedCount} imagen(es) eliminada(s)`);
    setShowToast(true);
  };

  const addSelectedImagesToCanvas = () => {
    if (!editor) {
      setErrorMessage('Editor no disponible');
      return;
    }

    const selectedImages = uploadedImages.filter(img => img.selected);
    if (selectedImages.length === 0) {
      setErrorMessage('No hay imágenes seleccionadas para añadir');
      return;
    }

    selectedImages.forEach(img => {
      const component = editor.DomComponents.addComponent({
        type: 'image',
        attributes: {
          src: img.url,
          alt: img.filename
        },
        style: {
          'max-width': '100%',
          'height': 'auto'
        }
      });
      
      // Opcional: seleccionar el componente recién añadido
      editor.select(component);
    });

    setToastMessage(`${selectedImages.length} imagen(es) añadida(s) al lienzo`);
    setShowToast(true);
    
    // Cerrar el modal después de añadir las imágenes
    onHide();
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Importar Imágenes</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formFile" className="mb-3">
              <Form.Label>Seleccionar imágenes para subir</Form.Label>
              <Form.Control 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange} 
                accept="image/*" 
                multiple 
                disabled={isUploading}
              />
              <Form.Text className="text-muted">
                Formatos soportados: JPEG, PNG, GIF, SVG, WebP
              </Form.Text>
            </Form.Group>
          </Form>
          
          {isUploading && (
            <div className="text-center my-3">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
              <p className="mt-2">Subiendo imágenes...</p>
            </div>
          )}
          
          {errorMessage && (
            <div className="alert alert-danger mt-3" role="alert">
              {errorMessage}
            </div>
          )}
          
          {uploadedImages.length > 0 && (
            <div className="mt-4">
              <div className="d-flex justify-content-between mb-3">
                <h5>Imágenes disponibles</h5>
                <div>
                  <Button variant="outline-primary" size="sm" onClick={selectAllImages} className="me-2">
                    Seleccionar todo
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={deselectAllImages}>
                    Deseleccionar todo
                  </Button>
                </div>
              </div>
              
              <Row xs={2} md={3} lg={4} className="g-3">
                {uploadedImages.map(image => (
                  <Col key={image.id}>
                    <Card 
                      className={`h-100 ${image.selected ? 'border-primary' : ''}`}
                      onClick={() => toggleImageSelection(image.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ position: 'relative', paddingTop: '75%', overflow: 'hidden' }}>
                        <Card.Img 
                          variant="top" 
                          src={image.url} 
                          alt={image.filename}
                          style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </div>
                      <Card.Body className="p-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="text-truncate small">
                            {image.filename}
                          </div>
                          {image.selected && (
                            <Badge bg="primary" pill>
                              ✓
                            </Badge>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={deleteSelectedImages} disabled={!uploadedImages.some(img => img.selected)}>
            Eliminar seleccionadas
          </Button>
          <Button variant="secondary" onClick={onHide}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={addSelectedImagesToCanvas} disabled={!uploadedImages.some(img => img.selected)}>
            Añadir seleccionadas
          </Button>
        </Modal.Footer>
      </Modal>
      
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1070 }}>
        <Toast 
          onClose={() => setShowToast(false)} 
          show={showToast} 
          delay={3000} 
          autohide
          bg="success"
          text="white"
        >
          <Toast.Header>
            <strong className="me-auto">Notificación</strong>
          </Toast.Header>
          <Toast.Body>{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default ImportImageModal; 