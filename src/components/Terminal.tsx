"use client";
import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

interface TerminalProps {
  content?: string;
  onData?: (data: string) => void;
  className?: string;
}

export function Terminal({ content, onData, className }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new XTerm({
      theme: {
        background: "#0a0a0a",
        foreground: "#e0e0e0",
        cursor: "#10b981",
        selectionBackground: "#10b98133",
        black: "#0a0a0a",
        red: "#ef4444",
        green: "#10b981",
        yellow: "#f59e0b",
        blue: "#3b82f6",
        magenta: "#a855f7",
        cyan: "#06b6d4",
        white: "#e0e0e0",
      },
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
      convertEol: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();

    termRef.current = term;
    fitRef.current = fit;

    if (onData) {
      term.onData(onData);
    }

    const observer = new ResizeObserver(() => {
      fit.fit();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      term.dispose();
    };
  }, []);

  // Write content when it changes
  useEffect(() => {
    if (termRef.current && content) {
      termRef.current.write(content);
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`rounded-lg overflow-hidden ${className || ""}`}
      style={{ minHeight: 200 }}
    />
  );
}

// Hook for streaming content to a terminal ref
export function useTerminalWriter() {
  const termRef = useRef<XTerm | null>(null);

  function write(data: string) {
    termRef.current?.write(data);
  }

  function writeln(data: string) {
    termRef.current?.writeln(data);
  }

  function clear() {
    termRef.current?.clear();
  }

  return { termRef, write, writeln, clear };
}
