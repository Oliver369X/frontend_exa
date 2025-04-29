'use client';

import { useEffect, useRef, useState } from 'react';

export function Terminal() {
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [output, setOutput] = useState<string[]>(['Terminal inicializada', 'Escribe un comando y presiona Enter']);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentCommand.trim()) {
      // Procesar el comando
      const newOutput = [...output, `$ ${currentCommand}`];
      
      // Simular respuesta del comando
      switch (currentCommand.trim().toLowerCase()) {
        case 'help':
          newOutput.push('Comandos disponibles: help, clear, echo, ls, pwd');
          break;
        case 'clear':
          setOutput([]);
          setCurrentCommand('');
          return;
        case 'ls':
          newOutput.push('archivo1.txt  archivo2.js  carpeta/');
          break;
        case 'pwd':
          newOutput.push('/proyecto/actual');
          break;
        default:
          if (currentCommand.trim().startsWith('echo ')) {
            newOutput.push(currentCommand.trim().substring(5));
          } else {
            newOutput.push(`Comando no reconocido: ${currentCommand}`);
          }
      }
      
      // Actualizar historial y salida
      setCommandHistory([...commandHistory, currentCommand]);
      setOutput(newOutput);
      setCurrentCommand('');
      
      // Desplazar al final
      setTimeout(() => {
        if (terminalRef.current) {
          terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
      }, 0);
    }
  };

  useEffect(() => {
    // Enfocar el input cuando se monta el componente
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="text-sm font-medium">Terminal</div>
      </div>
      
      <div 
        ref={terminalRef}
        className="flex-grow p-2 font-mono text-sm overflow-auto"
        onClick={() => inputRef.current?.focus()}
      >
        {output.map((line, index) => (
          <div key={index} className="whitespace-pre-wrap">{line}</div>
        ))}
        <div className="flex items-center">
          <span className="mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleCommand}
            className="flex-grow bg-transparent outline-none"
            autoFocus
          />
        </div>
      </div>
    </div>
  );
}