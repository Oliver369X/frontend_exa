import React, { useState, useRef } from 'react';
import { Modal, Button, Form, Spinner, Alert, InputGroup, Row, Col, Card } from 'react-bootstrap';
import { Editor } from 'grapesjs';
import { FaUpload, FaLink, FaImages, FaSearch, FaTimes } from 'react-icons/fa';

interface ImageImportModalProps {
  show: boolean;
  onHide: () => void;
  editor: Editor | null;
}

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
  uploadTime?: Date;
}

const ImageImportModal: React.FC<ImageImportModalProps> = ({ show, onHide, editor }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'gallery'>('upload');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<UploadedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpiar estados al abrir/cerrar modal
  React.useEffect(() => {
    if (!show) {
      // Tiempo para que se complete la animación de cierre
      setTimeout(() => {
        setImageUrl('');
        setError(null);
        setSuccess(null);
        setSelectedImages([]);
      }, 300);
    } else {
      // Cargar galería cuando se muestra el modal
      loadGalleryImages();
    }
  }, [show]);

  const loadGalleryImages = async () => {
    // Solo cargar si estamos en la pestaña galería o al abrir el modal por primera vez
    if (!show && activeTab !== 'gallery') return;
    
    setIsGalleryLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/images/list');
      if (!response.ok) {
        throw new Error('Error al cargar imágenes de la galería');
      }
      
      const data = await response.json();
      setGalleryImages(data.images || []);
    } catch (err) {
      console.error('Error cargando galería:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar la galería');
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    let hasInvalidFile = false;

    // Validar y añadir archivos al FormData
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        hasInvalidFile = true;
        return;
      }
      formData.append('images', file);
    });

    if (hasInvalidFile) {
      setError('Solo se permiten archivos de imagen.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir imágenes');
      }

      const data = await response.json();
      
      // Actualizar galería con nuevas imágenes
      setGalleryImages(prev => [...(data.images || []), ...prev]);
      
      setSuccess(`${files.length > 1 ? `${files.length} imágenes subidas` : 'Imagen subida'} correctamente.`);
      
      // Limpiar input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Si solo hay una imagen, seleccionarla automáticamente
      if (files.length === 1 && data.images && data.images.length === 1) {
        setSelectedImages([data.images[0].url]);
      }
      
      // Cambiar a la pestaña de galería para mostrar las imágenes recién subidas
      setActiveTab('gallery');
    } catch (err) {
      console.error('Error en carga:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al subir imágenes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddByUrl = () => {
    if (!imageUrl.trim()) {
      setError('Por favor, introduce una URL de imagen.');
      return;
    }

    if (!editor) {
      setError('No se pudo acceder al editor.');
      return;
    }

    try {
      // Validación básica de URL
      new URL(imageUrl);
      
      // Añadir la imagen al editor
      const imageComponent = editor.runCommand('open-assets');
      editor.AssetManager.add(imageUrl);
      
      setSuccess('Imagen añadida correctamente al editor.');
      setImageUrl('');
      
      // Cerrar el modal después de un corto tiempo
      setTimeout(() => onHide(), 1500);
    } catch (err) {
      console.error('Error con la URL:', err);
      setError('URL de imagen no válida. Asegúrate de que comienza con http:// o https://');
    }
  };

  const handleGallerySelect = (imageUrl: string) => {
    // Toggle selección
    if (selectedImages.includes(imageUrl)) {
      setSelectedImages(prev => prev.filter(url => url !== imageUrl));
    } else {
      setSelectedImages(prev => [...prev, imageUrl]);
    }
  };

  const handleAddSelectedToCanvas = () => {
    if (!editor) {
      setError('No se pudo acceder al editor.');
      return;
    }

    if (selectedImages.length === 0) {
      setError('Por favor, selecciona al menos una imagen.');
      return;
    }

    try {
      // Abre el administrador de assets
      editor.runCommand('open-assets');
      
      // Añade todas las imágenes seleccionadas al asset manager
      selectedImages.forEach(url => {
        editor.AssetManager.add(url);
      });
      
      setSuccess(`${selectedImages.length > 1 ? `${selectedImages.length} imágenes añadidas` : 'Imagen añadida'} correctamente al editor.`);
      
      // Cerrar el modal después de un corto tiempo
      setTimeout(() => onHide(), 1500);
    } catch (err) {
      console.error('Error al añadir imágenes:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al añadir imágenes');
    }
  };

  const filteredImages = searchTerm.trim() === '' 
    ? galleryImages 
    : galleryImages.filter(img => 
        img.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Importar Imágenes</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}
        
        <div className="mb-4">
          <Form.Group>
            <div className="d-flex border-bottom">
              <Button
                variant={activeTab === 'upload' ? 'primary' : 'outline-secondary'}
                className="flex-grow-1 border-0 rounded-0"
                onClick={() => setActiveTab('upload')}
              >
                <FaUpload className="me-2" /> Subir
              </Button>
              <Button
                variant={activeTab === 'url' ? 'primary' : 'outline-secondary'}
                className="flex-grow-1 border-0 rounded-0"
                onClick={() => setActiveTab('url')}
              >
                <FaLink className="me-2" /> URL
              </Button>
              <Button
                variant={activeTab === 'gallery' ? 'primary' : 'outline-secondary'}
                className="flex-grow-1 border-0 rounded-0"
                onClick={() => {
                  setActiveTab('gallery');
                  loadGalleryImages();
                }}
              >
                <FaImages className="me-2" /> Galería
              </Button>
            </div>
          </Form.Group>
        </div>
        
        {activeTab === 'upload' && (
          <div>
            <div className="text-center border rounded-3 p-4 mb-3" 
                 style={{ 
                   cursor: 'pointer',
                   backgroundColor: '#f8f9fa',
                   minHeight: '200px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   flexDirection: 'column'
                 }}
                 onClick={() => fileInputRef.current?.click()}>
              <FaUpload size={48} className="mb-3 text-secondary" />
              <p className="mb-1">Arrastra tus imágenes aquí o haz clic para seleccionar</p>
              <p className="text-muted small">Se admiten JPG, PNG, GIF, SVG (máx. 5MB por archivo)</p>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={isLoading}
              />
            </div>
            
            {isLoading && (
              <div className="text-center py-3">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </Spinner>
                <p className="mt-2">Subiendo imágenes...</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'url' && (
          <div>
            <Form.Group className="mb-3">
              <Form.Label>URL de la imagen</Form.Label>
              <InputGroup>
                <Form.Control
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Button 
                  variant="primary" 
                  onClick={handleAddByUrl}
                  disabled={!imageUrl.trim()}
                >
                  Añadir
                </Button>
              </InputGroup>
              <Form.Text className="text-muted">
                Introduce la URL completa de la imagen incluyendo http:// o https://
              </Form.Text>
            </Form.Group>
            
            {imageUrl.trim() && (
              <div className="text-center border p-3 mt-3">
                <p>Vista previa:</p>
                <div className="mt-2 mb-3">
                  <img 
                    src={imageUrl} 
                    style={{ maxWidth: '100%', maxHeight: '200px' }} 
                    alt="Vista previa"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiM5OTkiPkVycm9yIGRlIGNhcmdhPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'gallery' && (
          <div>
            <div className="mb-3">
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Buscar imágenes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                    <FaTimes />
                  </Button>
                )}
              </InputGroup>
            </div>
            
            {isGalleryLoading ? (
              <div className="text-center py-4">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </Spinner>
                <p className="mt-2">Cargando galería...</p>
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-4 border rounded">
                <p className="text-muted mb-0">
                  {searchTerm ? 'No se encontraron imágenes que coincidan con tu búsqueda.' : 'No hay imágenes disponibles en la galería.'}
                </p>
              </div>
            ) : (
              <>
                <p className="mb-2">
                  Seleccionadas: {selectedImages.length} de {filteredImages.length} imágenes
                </p>
                <div className="gallery-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <Row xs={2} md={3} lg={4} className="g-3">
                    {filteredImages.map(image => (
                      <Col key={image.id}>
                        <Card 
                          className={`h-100 ${selectedImages.includes(image.url) ? 'border-primary' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleGallerySelect(image.url)}
                        >
                          <div style={{ 
                            height: '120px', 
                            overflow: 'hidden', 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f8f9fa'
                          }}>
                            <Card.Img 
                              variant="top" 
                              src={image.url} 
                              style={{ 
                                objectFit: 'contain',
                                maxHeight: '100%', 
                                maxWidth: '100%'
                              }}
                            />
                          </div>
                          <Card.Body className="p-2">
                            <p className="small text-truncate mb-0" title={image.name}>
                              {image.name}
                            </p>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
                
                <div className="d-grid mt-3">
                  <Button 
                    variant="primary" 
                    onClick={handleAddSelectedToCanvas}
                    disabled={selectedImages.length === 0}
                  >
                    Añadir {selectedImages.length} {selectedImages.length === 1 ? 'imagen' : 'imágenes'} seleccionada{selectedImages.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImageImportModal; 