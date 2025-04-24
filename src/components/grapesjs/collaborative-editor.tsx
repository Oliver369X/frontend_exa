"use client";

import { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import type { Editor } from "grapesjs";
import "grapesjs/dist/css/grapes.min.css";
import "./editor-styles.css";
import { toast } from "sonner";
import gjsBasicBlocks from "grapesjs-blocks-basic";

interface CollaborativeGrapesJSEditorProps {
  projectId: string;
  initialContent: string;
  onChange?: (html: string) => void;
  readOnly?: boolean;
}

export default function CollaborativeGrapesJSEditor({
  projectId,
  initialContent,
  onChange,
  readOnly = false,
}: CollaborativeGrapesJSEditorProps) {
  const editorRef = useRef<Editor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return;

    const editor = grapesjs.init({
      container: containerRef.current,
      height: "70vh",
      width: "auto",
      storageManager: false,
      plugins: [gjsBasicBlocks],
      panels: { defaults: [] },
    });

    if (initialContent) {
      editor.setComponents(initialContent);
    }

    if (!readOnly && typeof onChange === 'function') {
      editor.on("component:update", () => {
        const html = editor.getHtml();
        onChange(html);
      });
    }

    editorRef.current = editor;
    setIsLoading(false);

    return () => {
      if (editorRef.current) {
        try {
          editorRef.current.destroy();
        } catch (error) {
          console.error('Error al destruir el editor:', error);
        }
        editorRef.current = null;
      }
    };
  }, [initialContent, onChange, readOnly]);

  const saveContent = async () => {
    if (!editorRef.current || !projectId) return;

    try {
      const html = editorRef.current.getHtml();
      
      if (onChange) onChange(html);
      
      const response = await fetch(`http://localhost:4000/projects/${projectId}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html }),
      });

      if (response.ok) {
        toast.success("Contenido guardado");
      } else {
        throw new Error(`Error al guardar`);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al guardar");
    }
  };

  return (
    <div className="grapesjs-editor-wrapper">
      <div className="editor-container">
        <div ref={containerRef} className="editor-canvas">
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <div className="loading-text">Cargando editor...</div>
            </div>
          )}
        </div>
        
        {!readOnly && (
          <div className="editor-actions">
            <button 
              className="save-button"
              onClick={saveContent}
              disabled={isLoading}
            >
              Guardar
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .grapesjs-editor-wrapper {
          width: 100%;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .editor-container {
          display: flex;
          flex-direction: column;
        }
        
        .editor-canvas {
          min-height: 500px;
          position: relative;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.8);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 100;
        }
        
        .loading-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 2s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-text {
          font-size: 16px;
          color: #333;
        }
        
        .editor-actions {
          display: flex;
          justify-content: flex-end;
          padding: 12px;
          background-color: #f5f5f5;
          border-top: 1px solid #ddd;
        }
        
        .save-button {
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 0.25rem;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .save-button:hover {
          background-color: #1d4ed8;
        }
        
        .save-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
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
}