'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeMirrorEditorProps {
  value: string;
  language?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export function CodeMirrorEditor({
  value,
  language = 'javascript',
  onChange,
  readOnly = false,
}: CodeMirrorEditorProps) {
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
      case 'markdown':
        languageSupport = markdown();
        break;
      case 'python':
        languageSupport = python();
        break;
      default:
        languageSupport = javascript();
    }

    // Crear nueva vista del editor
    const view = new EditorView({
      doc: value,
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
  }, [language, readOnly]);

  // Actualizar el contenido cuando cambia el valor externo
  useEffect(() => {
    if (viewRef.current) {
      const currentValue = viewRef.current.state.doc.toString();
      if (value !== currentValue) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentValue.length,
            insert: value
          }
        });
      }
    }
  }, [value]);

  return <div ref={editorRef} className="h-full w-full" />;
}