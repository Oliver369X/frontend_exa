'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Modal, Button, Tab, Nav, Form, Spinner, Alert } from 'react-bootstrap';
import { 
  FiUpload, 
  FiCode, 
  FiFile, 
  FiCheck, 
  FiX, 
  FiEye, 
  FiLayout, 
  FiArrowRight, 
  FiInfo 
} from 'react-icons/fi';
import styles from './ImportXmlModal.module.css';

interface ParsedElement {
  tagName: string;
  attributes: Record<string, string>;
  children: ParsedElement[];
  content?: string;
}

interface ImportXmlModalProps {
  show: boolean;
  onHide: () => void;
  onImport: (components: any[]) => void;
  editorInstance?: any;
}

const ImportXmlModal: React.FC<ImportXmlModalProps> = ({ 
  show, 
  onHide, 
  onImport,
  editorInstance
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [xmlContent, setXmlContent] = useState<string>('');
  const [dragging, setDragging] = useState<boolean>(false);
  const [parsedXml, setParsedXml] = useState<ParsedElement | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionSuccess, setConversionSuccess] = useState<boolean>(false);
  const [convertedComponents, setConvertedComponents] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);
  
  const resetState = useCallback(() => {
    setFile(null);
    setXmlContent('');
    setParsedXml(null);
    setError(null);
    setConversionSuccess(false);
    setConvertedComponents([]);
    setStep(1);
    setActiveTab('upload');
  }, []);
  
  const closeModal = useCallback(() => {
    resetState();
    onHide();
  }, [onHide, resetState]);
  
  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setError(null);
    setLoading(true);
    const uploadedFile = files[0];
    
    // Verificar si es un archivo XML
    if (!uploadedFile.name.toLowerCase().endsWith('.xml')) {
      setError('El archivo debe ser de tipo XML (.xml)');
      setLoading(false);
      return;
    }
    
    setFile(uploadedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const content = e.target.result as string;
        setXmlContent(content);
        parseXmlContent(content);
      }
    };
    
    reader.onerror = () => {
      setError('Error al leer el archivo');
      setLoading(false);
    };
    
    reader.readAsText(uploadedFile);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (e.dataTransfer?.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);
  
  const parseXmlContent = useCallback((content: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      
      // Verificar si hay errores de parsing
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML inválido');
      }
      
      const rootElement = xmlDoc.documentElement;
      const jsonResult = domToJson(rootElement);
      
      setParsedXml(jsonResult);
      setLoading(false);
      setStep(2);
    } catch (err) {
      setError((err as Error).message || 'Error al analizar el XML');
      setParsedXml(null);
      setLoading(false);
    }
  }, []);
  
  const domToJson = (node: Node): ParsedElement => {
    if (node.nodeType === Node.TEXT_NODE) {
      const content = node.textContent?.trim() || '';
      return {
        tagName: '#text',
        attributes: {},
        children: [],
        content: content.length > 0 ? content : undefined
      };
    }
    
    const element = node as Element;
    const result: ParsedElement = {
      tagName: element.tagName,
      attributes: {},
      children: []
    };
    
    // Extraer atributos
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      result.attributes[attr.name] = attr.value;
    }
    
    // Procesar nodos hijos
    element.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const content = child.textContent?.trim() || '';
        if (content.length > 0) {
          result.content = content;
        }
      } else {
        result.children.push(domToJson(child));
      }
    });
    
    return result;
  };
  
  const applyXmlTextContent = useCallback(() => {
    if (!textareaRef.current?.value) {
      setError('Ingrese contenido XML válido');
      return;
    }
    
    const content = textareaRef.current.value;
    setXmlContent(content);
    parseXmlContent(content);
  }, [parseXmlContent]);
  
  const convertToGrapesJS = useCallback(() => {
    setLoading(true);
    setError(null);
    
    try {
      if (!parsedXml) {
        throw new Error('No hay un documento XML válido para convertir');
      }
      
      // Función recursiva para convertir elementos XML a componentes GrapesJS
      const createComponent = (element: ParsedElement): any => {
        // Ignorar nodos de texto
        if (element.tagName === '#text') {
          return null;
        }
        
        // Mapeo de etiquetas HTML comunes a tipos de componentes GrapesJS
        const componentTypeMap: Record<string, string> = {
          div: 'div',
          span: 'text',
          p: 'text',
          h1: 'text',
          h2: 'text',
          h3: 'text',
          h4: 'text',
          h5: 'text',
          h6: 'text',
          button: 'button',
          a: 'link',
          img: 'image',
          input: 'input',
          form: 'form',
          section: 'section',
          header: 'header',
          footer: 'footer',
          nav: 'navbar',
          ul: 'list',
          table: 'table'
        };
        
        // Determinar el tipo de componente
        const tagName = element.tagName.toLowerCase();
        const type = componentTypeMap[tagName] || 'default';
        
        // Crear propiedades del componente
        const component: any = {
          type,
          tagName,
          attributes: { ...element.attributes },
        };
        
        // Manejar contenido de texto directo
        if (element.content) {
          component.content = element.content;
        }
        
        // Procesar componentes hijos
        if (element.children && element.children.length > 0) {
          component.components = element.children
            .map(child => createComponent(child))
            .filter(Boolean); // Filtrar nulos
        }
        
        // Manejar casos especiales
        if (tagName === 'img' && element.attributes.src) {
          component.src = element.attributes.src;
        }
        
        return component;
      };
      
      // Convertir el XML a componentes GrapesJS
      const components = parsedXml.children
        .map(child => createComponent(child))
        .filter(Boolean);
      
      setConvertedComponents(components);
      setConversionSuccess(true);
      setLoading(false);
      setStep(3);
    } catch (err) {
      setError((err as Error).message || 'Error al convertir el XML');
      setConversionSuccess(false);
      setLoading(false);
    }
  }, [parsedXml]);
  
  const handleImport = useCallback(() => {
    if (convertedComponents.length === 0) {
      setError('No hay componentes para importar');
      return;
    }
    
    try {
      onImport(convertedComponents);
      closeModal();
    } catch (err) {
      setError((err as Error).message || 'Error al importar los componentes');
    }
  }, [convertedComponents, onImport, closeModal]);
  
  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  
  useEffect(() => {
    if (show) {
      resetState();
    }
  }, [show, resetState]);
  
  const renderStepIndicator = () => (
    <div className={styles.stepIndicator}>
      <div className={`${styles.step} ${step === 1 ? styles.active : ''}`}>
        <FiUpload size={16} style={{ marginRight: '8px' }} />
        Subir XML
      </div>
      <div className={styles.stepDivider} />
      <div className={`${styles.step} ${step === 2 ? styles.active : ''}`}>
        <FiEye size={16} style={{ marginRight: '8px' }} />
        Vista Previa
      </div>
      <div className={styles.stepDivider} />
      <div className={`${styles.step} ${step === 3 ? styles.active : ''}`}>
        <FiLayout size={16} style={{ marginRight: '8px' }} />
        Importar
      </div>
    </div>
  );
  
  const renderUploadStep = () => (
    <>
      <Tab.Container id="import-tabs" activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
        <Nav variant="tabs" className={styles.importTabs}>
          <Nav.Item>
            <Nav.Link eventKey="upload">
              <FiUpload size={16} style={{ marginRight: '8px' }} />
              Subir archivo
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="paste">
              <FiCode size={16} style={{ marginRight: '8px' }} />
              Pegar código
            </Nav.Link>
          </Nav.Item>
        </Nav>
        <Tab.Content>
          <Tab.Pane eventKey="upload">
            <div
              ref={dropAreaRef}
              className={`${styles.uploadContainer} ${dragging ? styles.dragging : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <FiFile size={48} color="#0d6efd" />
              <h5>Arrastra y suelta tu archivo XML aquí</h5>
              <Button 
                variant="primary" 
                className={styles.uploadButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrowseClick();
                }}
              >
                <FiUpload size={16} style={{ marginRight: '8px' }} />
                Seleccionar archivo
              </Button>
              <div className={styles.uploadHint}>
                <FiInfo size={14} />
                <span>Sólo archivos XML (.xml)</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xml"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>
          </Tab.Pane>
          <Tab.Pane eventKey="paste">
            <div className={styles.codeEditorContainer}>
              <Form.Group>
                <Form.Label>Pega tu código XML:</Form.Label>
                <Form.Control
                  as="textarea"
                  ref={textareaRef}
                  rows={10}
                  placeholder="<root>...</root>"
                />
              </Form.Group>
              <Button 
                variant="primary" 
                className={styles.applyButton}
                onClick={applyXmlTextContent}
              >
                <FiCheck size={16} style={{ marginRight: '8px' }} />
                Aplicar
              </Button>
            </div>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </>
  );
  
  const renderPreviewStep = () => (
    <>
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <FiEye size={16} />
          Vista previa XML
        </div>
        <div className={styles.codePreview}>
          {parsedXml ? (
            <pre>{JSON.stringify(parsedXml, null, 2)}</pre>
          ) : (
            <div className={styles.emptyPreview}>
              <FiInfo size={24} />
              <p>No hay contenido XML para mostrar</p>
            </div>
          )}
        </div>
      </div>
      <div className={styles.convertContainer}>
        <Button 
          variant="primary" 
          size="lg"
          onClick={convertToGrapesJS}
          disabled={!parsedXml || loading}
        >
          Convertir a componentes
          <FiArrowRight size={16} style={{ marginLeft: '8px' }} />
        </Button>
      </div>
    </>
  );
  
  const renderImportStep = () => (
    <>
      <div className={styles.previewContainer}>
        <div className={styles.previewHeader}>
          <FiLayout size={16} />
          Componentes convertidos
        </div>
        <div className={styles.codePreview}>
          <pre>{JSON.stringify(convertedComponents, null, 2)}</pre>
        </div>
      </div>
      <div className={styles.conversionInfo}>
        {conversionSuccess ? (
          <div className={`${styles.conversionStatus} ${styles.success}`}>
            <FiCheck size={20} />
            Conversión exitosa. Se generaron {convertedComponents.length} componentes.
          </div>
        ) : (
          <div className={`${styles.conversionStatus} ${styles.error}`}>
            <FiX size={20} />
            Error en la conversión.
          </div>
        )}
      </div>
    </>
  );
  
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return renderUploadStep();
      case 2:
        return renderPreviewStep();
      case 3:
        return renderImportStep();
      default:
        return null;
    }
  };
  
  return (
    <Modal
      show={show}
      onHide={closeModal}
      size="lg"
      centered
      dialogClassName={styles.importXmlModal}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          <FiFile size={20} style={{ marginRight: '10px' }} />
          Importar XML
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {renderStepIndicator()}
        
        {error && (
          <Alert variant="danger" className="mb-3">
            <FiX size={16} style={{ marginRight: '8px' }} />
            {error}
          </Alert>
        )}
        
        {loading ? (
          <div className="d-flex justify-content-center my-5">
            <Spinner animation="border" role="status" variant="primary">
              <span className="visually-hidden">Cargando...</span>
            </Spinner>
          </div>
        ) : (
          renderStepContent()
        )}
      </Modal.Body>
      <div className={styles.modalFooter}>
        <Button 
          variant="secondary" 
          onClick={closeModal}
        >
          Cancelar
        </Button>
        
        {step > 1 && (
          <Button 
            variant="outline-primary" 
            onClick={() => setStep(prev => (prev - 1) as 1 | 2 | 3)}
          >
            Atrás
          </Button>
        )}
        
        {step === 3 && (
          <Button 
            variant="success" 
            onClick={handleImport}
            disabled={!conversionSuccess || convertedComponents.length === 0}
          >
            <FiCheck size={16} style={{ marginRight: '8px' }} />
            Importar componentes
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default ImportXmlModal; 