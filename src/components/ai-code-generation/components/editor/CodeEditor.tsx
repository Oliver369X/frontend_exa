'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
  code: string;
  language?: string;
  onChange?: (code: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({
  code,
  language = 'typescript',
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Limpiar editor anterior si existe
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    // Determinar el lenguaje a usar
    let languageSupport;
    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'jsx':
      case 'tsx':
        languageSupport = javascript();
        break;
      case 'html':
        languageSupport = html();
        break;
      case 'css':
      case 'scss':
        languageSupport = css();
        break;
      case 'json':
        languageSupport = json();
        break;
      default:
        languageSupport = javascript();
    }

    // Crear nueva vista del editor
    const view = new EditorView({
      doc: code,
      extensions: [
        basicSetup,
        languageSupport,
        oneDark,
        EditorView.editable.of(!readOnly),
        EditorView.updateListener.of(update => {
          if (update.docChanged && onChange) {
            onChange(update.state.doc.toString());
          }
        })
      ],
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [code, language, readOnly, onChange]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="text-sm font-medium">Editor de Código</div>
        <div className="text-xs text-gray-400">Lenguaje: {language}</div>
      </div>
      <div ref={editorRef} className="h-full w-full overflow-auto" />
    </div>
  );
}