'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Bienvenido al Generador de Código Angular</h3>
          <p>Describe la aplicación que deseas crear y la IA generará el código para ti.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg ${
            message.role === 'user'
              ? 'bg-blue-50 ml-8'
              : 'bg-gray-50 mr-8'
          }`}
        >
          <div className="font-medium mb-1">
            {message.role === 'user' ? 'Tú' : 'Asistente IA'}
          </div>
          <div className="prose max-w-none">
            {message.imageUrl && (
              <img 
                src={message.imageUrl} 
                alt="Imagen adjunta" 
                className="max-w-full max-h-60 rounded mb-2 object-contain" 
              />
            )}
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
}