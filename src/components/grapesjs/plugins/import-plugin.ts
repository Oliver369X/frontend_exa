import GrapesJS from 'grapesjs';
import React from 'react';
import { createRoot } from 'react-dom/client';
import ImportXmlModal from '../modals/ImportXmlModal';
import { FiCode } from 'react-icons/fi';

export interface ImportPluginOptions {
  // Opciones personalizables del plugin
}

const ImportPlugin = (editor: GrapesJS.Editor, opts: ImportPluginOptions = {}) => {
  // Id único para el elemento del modal
  const modalContainerId = 'gjs-import-xml-modal-container';
  let modalRoot: ReturnType<typeof createRoot> | null = null;
  
  // Añadir contenedor para el modal si no existe
  if (!document.getElementById(modalContainerId)) {
    const modalContainer = document.createElement('div');
    modalContainer.id = modalContainerId;
    document.body.appendChild(modalContainer);
    modalRoot = createRoot(modalContainer);
  } else {
    const container = document.getElementById(modalContainerId);
    if (container) modalRoot = createRoot(container);
  }
  
  // Comando para abrir el modal de importación XML
  editor.Commands.add('open-import-xml-modal', {
    run(editor) {
      let modalOpen = true;
      
      const handleImport = (components: any[]) => {
        try {
          if (!components || components.length === 0) {
            editor.Notifications.error('No hay componentes para importar');
            return;
          }
          
          // Añadir componentes al canvas
          const wrapper = editor.getWrapper();
          if (wrapper) {
            components.forEach(comp => {
              wrapper.append(comp);
            });
            editor.Notifications.success('¡Componentes importados correctamente!');
          }
        } catch (error) {
          console.error('Error al importar componentes:', error);
          editor.Notifications.error('Error al importar componentes');
        }
      };
      
      const handleClose = () => {
        modalOpen = false;
        renderModal();
      };
      
      const renderModal = () => {
        if (modalRoot) {
          modalRoot.render(
            React.createElement(ImportXmlModal, {
              show: modalOpen,
              onHide: handleClose,
              onImport: handleImport,
              editorInstance: editor
            })
          );
        }
      };
      
      renderModal();
    }
  });
  
  // Añadir botón de importación XML en las opciones del panel
  editor.Panels.addButton('options', {
    id: 'import-xml',
    className: 'gjs-pn-btn import-xml-btn',
    label: 'Importar XML',
    command: 'open-import-xml-modal',
    attributes: {
      title: 'Importar contenido XML'
    }
  });
  
  // Limpiar al destruir el editor
  editor.on('destroy', () => {
    if (modalRoot) {
      modalRoot.unmount();
    }
    const container = document.getElementById(modalContainerId);
    if (container) {
      document.body.removeChild(container);
    }
  });
};

export default ImportPlugin; 