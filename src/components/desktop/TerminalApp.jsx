import { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

const TERMINAL_WS = 'ws://localhost:8002/api/desktop/terminal';

export default function TerminalApp({ resizeSignal }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"Cascadia Code", "Fira Code", Consolas, monospace',
      fontSize: 13,
      theme: {
        background: '#0c0f16',
        foreground: '#e8ecf6',
        cursor: '#6ea8fe',
      },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitRef.current = fitAddon;

    const socket = new WebSocket(TERMINAL_WS);
    socket.binaryType = 'arraybuffer';
    socketRef.current = socket;

    socket.onopen = () => {
      const { cols, rows } = term;
      socket.send(`\x00RESIZE:${cols},${rows}`);
    };

    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        term.write(event.data);
      } else {
        term.write(new Uint8Array(event.data));
      }
    };

    socket.onclose = () => {
      term.write('\r\n\r\n[Yhteys päätteeseen katkesi]\r\n');
    };

    const dataDisposable = term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    });

    return () => {
      dataDisposable.dispose();
      socket.close();
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fitRef.current || !termRef.current) return;
    fitRef.current.fit();
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      const { cols, rows } = termRef.current;
      socket.send(`\x00RESIZE:${cols},${rows}`);
    }
  }, [resizeSignal]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', padding: '0.4rem', boxSizing: 'border-box' }}
    />
  );
}
