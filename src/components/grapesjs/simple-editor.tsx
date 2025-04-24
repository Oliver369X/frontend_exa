"use client";

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import grapesjs from "grapesjs";
import type { Editor, EditorConfig } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import { useSession } from "next-auth/react";
import { getApiUrl } from "@/lib/api";

// Basic blocks plugin (you can add more plugins as needed)
import gjsBasicBlocks from "grapesjs-blocks-basic";

// Define the expected structure for designData
interface GrapesJSData {
  components?: any[]; // GrapesJS component structure
  styles?: string;     // GrapesJS CSS string
}

// Define the structure for delta updates
export interface EditorDeltaUpdate {
  type: 'component:add' | 'component:update' | 'component:remove' | 'component:move' | 'style:update' | 'style:add' | 'style:remove'; // Type of change
  data: any; // Data associated with the change (e.g., component JSON, style object, move info)
  // Optional: Add component ID, parent ID, index for more context
  componentId?: string;
  parentId?: string;
  index?: number;
}

interface SimpleGrapesJSEditorProps {
  projectId: string;
  // Accept either the GrapesJSData object or an HTML string
  initialContent: GrapesJSData | string | null;
  // Pass back DELTA updates on change
  onChange?: (update: EditorDeltaUpdate) => void; 
  readOnly?: boolean;
}

// Define the type for the exposed handle
export interface SimpleGrapesEditorHandle {
  getEditorInstance: () => Editor | null;
}

// Wrap component with forwardRef
const SimpleGrapesJSEditor = forwardRef<SimpleGrapesEditorHandle, SimpleGrapesJSEditorProps>((
  { projectId, initialContent, onChange, readOnly = false },
  ref // Receive the ref from parent
) => {
  const editorRefInternal = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  // isEditorReady is used for UI state management and future feature expansion
  const { data: session } = useSession();

  // Expose the editor instance via useImperativeHandle
  useImperativeHandle(ref, () => ({
    getEditorInstance: () => editorRefInternal.current,
  }), []); // Add dependency array

  // Initialize the editor
  useEffect(() => {
    if (!containerRef.current || editorRefInternal.current) return;

    // Basic editor configuration
    const config: EditorConfig = {
      container: containerRef.current,
      height: "100%",
      width: "auto",
      fromElement: false,
      storageManager: false,
      plugins: [gjsBasicBlocks],
      pluginsOpts: {
        'grapesjs-blocks-basic': {
          blocks: ["column1", "column2", "column3", "text", "link", "image", "video"],
          flexGrid: true,
        },
      },
      blockManager: {
        appendTo: "#blocks-container",
        blocks: [
          {
            id: 'section',
            label: '<b>Section</b>',
            attributes: { class: 'gjs-block-section' },
            content: `<section style="padding: 50px 0; background-color: white;">
              <div style="max-width: 1200px; margin: 0 auto; padding: 0 15px;">
                <h2 style="margin-bottom: 20px;">Insert title here</h2>
                <p>Insert your text here</p>
              </div>
            </section>`,
          },
          {
            id: 'text',
            label: 'Text',
            content: '<div style="padding: 15px;">Insert your text here</div>',
          },
          {
            id: 'image',
            label: 'Image',
            select: true,
            content: { type: 'image' },
            activate: true,
          },
          {
            id: 'button',
            label: 'Button',
            content: '<button style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Click me</button>',
          },
        ],
      },
      panels: {
        defaults: [
          {
            id: "basic-actions",
            el: ".panel__basic-actions",
            buttons: [
              {
                id: "visibility",
                active: true,
                className: "btn-toggle-borders",
                label: "<u>B</u>",
                command: "sw-visibility",
              },
              {
                id: "export",
                className: "btn-open-export",
                label: "Exp",
                command: "export-template",
                context: "export-template",
              },
              {
                id: "show-json",
                className: "btn-show-json",
                label: "JSON",
                context: "show-json",
                command: (): void => {
                  if (!editorRefInternal.current) return;
                  const editor = editorRefInternal.current;
                  editor.Modal.setTitle("Components JSON")
                    .setContent(
                      `<textarea style="width:100%; height: 250px;">
                        ${JSON.stringify(editor.getComponents(), null, 2)}
                      </textarea>`
                    )
                    .open();
                },
              },
            ],
          },
        ],
      },
      deviceManager: {
        devices: [
          {
            name: "Desktop",
            width: "",
          },
          {
            name: "Mobile",
            width: "320px",
            widthMedia: "480px",
          },
        ],
      },
      // Set readonly mode if specified
      canvas: {
        styles: [
          "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css",
        ],
        scripts: [
          "https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js",
        ],
      },
    };

    // Initialize the editor
    const editor = grapesjs.init(config);
    editorRefInternal.current = editor;

    // Load initial content based on type
    if (initialContent) {
      if (typeof initialContent === 'object' && initialContent !== null && initialContent.hasOwnProperty('components')) {
        // Load from GrapesJSData object
        if (Array.isArray(initialContent.components) && initialContent.components.length > 0) {
          editor.addComponents(initialContent.components);
        } else if (!readOnly) {
           // Load default if object is empty and in edit mode
          editor.setComponents('<h1>Start Editing</h1>');
        }
        if (typeof initialContent.styles === 'string') {
          editor.setStyle(initialContent.styles);
        }
      } else if (typeof initialContent === 'string') {
        // Load from HTML string
        editor.setComponents(initialContent);
      } else if (!readOnly){
         // Load default if initialContent is null/undefined and in edit mode
         editor.setComponents('<h1>Start Editing</h1>');
      }
    } else if (!readOnly) {
      // Load default if initialContent is empty/null and in edit mode
      editor.setComponents('<h1>Start Editing</h1>');
    }

    // Set editor to readonly mode if specified
    if (readOnly) {
      editor.Commands.stop('core:component-select');
      editor.Commands.stop('core:component-move');
      editor.Commands.stop('core:component-delete');
      editor.Commands.stop('core:component-clone');
      editor.Commands.stop('core:component-copy');
      editor.Commands.stop('core:component-paste');
      editor.Commands.stop('core:component-style-clear');
      editor.Commands.stop('core:open-blocks');
      editor.Commands.stop('core:open-layers');
      editor.Commands.stop('core:open-styles');
      editor.Commands.stop('core:open-traits');
      editor.Commands.run('core:preview'); // Start in preview mode
      editor.UndoManager.clear();
    }

    // Handle content changes - pass DELTA updates
    if (onChange && !readOnly) {
      // Listen to specific component events
      editor.on("component:add", (component) => {
        onChange({ type: 'component:add', data: component.toJSON(), parentId: component.parent()?.getId(), index: component.index() });
      });
      editor.on("component:update", (component, changed) => {
         // Avoid sending updates for transient properties like 'status'
         if (!changed || Object.keys(changed).some(key => ['status', 'open'].includes(key))) return;
        onChange({ type: 'component:update', data: { changed, component: component.toJSON() }, componentId: component.getId() });
      });
      editor.on("component:remove", (component) => {
        onChange({ type: 'component:remove', data: { componentId: component.getId() }, parentId: component.parent()?.getId() });
      });
      editor.on("component:move", (component, data) => {
        onChange({ type: 'component:move', data: { ...data, componentId: component.getId() } });
      });

      // Listen to specific style events (add more as needed)
      editor.on("style:update", (style) => {
        // Need to figure out how to get style identifier/target if possible
        onChange({ type: 'style:update', data: style }); 
      });
       editor.on("style:add", (style) => {
         onChange({ type: 'style:add', data: style });
       });
       editor.on("style:remove", (style) => {
         onChange({ type: 'style:remove', data: style });
       });
      
      // Remove the old listener
      // editor.on("change:changesCount", () => { ... });
    }

    // Set editor as ready
    setIsEditorReady(true);

    // Cleanup
    return () => {
      if (editorRefInternal.current) {
        editorRefInternal.current.destroy();
        editorRefInternal.current = null;
      }
    };
  }, [JSON.stringify(initialContent), onChange, readOnly]);

  // Save content to backend when requested
  // Function to save content to backend
  const saveContent = async (): Promise<boolean> => {
    if (!editorRefInternal.current || !session?.backendToken) return false;

    try {
      const html = editorRefInternal.current.getHtml();
      const apiUrl = getApiUrl(`/projects/${projectId}/content`);
      
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.backendToken}`,
        },
        body: JSON.stringify({ content: html }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error("Error saving content:", error);
      return false;
    }
  };

  return (
    <div className="grapesjs-editor h-full">
      {/* Blocks panel */}
      {!readOnly && (
        <div className="editor-sidebar">
          <div className="sidebar-header">Blocks</div>
          <div className="blocks-container" id="blocks-container"></div>
        </div>
      )}
      
      <div className="editor-main">
        {/* Editor panels */}
        {!readOnly && (
          <div className="panel__basic-actions"></div>
        )}
        
        {/* Editor canvas */}
        <div ref={containerRef} className="editor-canvas flex-grow"></div>
      </div>

      <style jsx>{`
        .grapesjs-editor {
          display: flex;
          min-height: inherit;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .editor-sidebar {
          width: 240px;
          background-color: #f5f5f5;
          border-right: 1px solid #ddd;
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }
        
        .sidebar-header {
          padding: 12px;
          font-weight: 600;
          border-bottom: 1px solid #ddd;
          background-color: #e9e9e9;
        }
        
        .editor-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
          min-width: 0;
        }
        
        .panel__basic-actions {
          display: flex;
          padding: 8px;
          justify-content: center;
          background-color: #f5f5f5;
          border-bottom: 1px solid #ddd;
          flex-shrink: 0;
        }
        
        .blocks-container {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        
        .editor-canvas {
          flex: 1;
          position: relative;
          background-color: #f9f9f9;
        }
        
        /* Improve block styling */
        :global(.gjs-block) {
          width: 100% !important;
          min-height: 60px !important;
          margin-bottom: 10px !important;
          border: 1px solid #ddd !important;
          border-radius: 4px !important;
          transition: all 0.2s !important;
        }
        
        :global(.gjs-block:hover) {
          box-shadow: 0 2px 5px rgba(0,0,0,0.1) !important;
          transform: translateY(-2px) !important;
        }
        
        /* Hide UI elements in readonly mode */
        :global(.gjs-pn-buttons) {
          display: ${readOnly ? 'none' : 'flex'};
        }
      `}</style>
    </div>
  );
});

SimpleGrapesJSEditor.displayName = "SimpleGrapesJSEditor";

export default SimpleGrapesJSEditor;
