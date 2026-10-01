'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileCode2,
  FileCode,
  FileText,
  RotateCcw,
  Check,
  Code2,
  Plus,
  Trash2,
  Terminal,
  AlertTriangle,
  ClipboardPaste,
  ShieldAlert,
} from 'lucide-react';
import { StarterFile } from '@/lib/practicalBank';

interface CodeEditorProps {
  files: StarterFile[];
  activeFileIndex: number;
  onFileSelect: (index: number) => void;
  onCodeChange: (fileIndex: number, newContent: string) => void;
  onResetFile?: (fileIndex: number) => void;
  onKeyPress?: (e: { key: string; ctrlKey?: boolean; metaKey?: boolean }) => void;
  onPasteEvent?: (pastedText: string, filename: string) => void;
  onExternalDropAttempt?: (details: string) => void;
}

export default function CodeEditor({
  files,
  activeFileIndex,
  onFileSelect,
  onCodeChange,
  onResetFile,
  onKeyPress,
  onPasteEvent,
  onExternalDropAttempt,
}: CodeEditorProps) {
  const activeFile = files[activeFileIndex] || files[0];
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineNumbersRef = useRef<HTMLDivElement | null>(null);

  const [pasteNotice, setPasteNotice] = useState<{ charCount: number; isSuspicious: boolean } | null>(null);
  const [dropBlockedNotice, setDropBlockedNotice] = useState<string | null>(null);

  // Compute line count
  const lines = (activeFile?.content || '').split('\n');
  const lineCount = Math.max(1, lines.length);

  // Synchronize scroll between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Handle Tab key, Enter auto-indent, and record key telemetry
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Notify telemetry collector
    onKeyPress?.({
      key: e.key,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
    });

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;

      // Insert 2 spaces
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onCodeChange(activeFileIndex, newValue);

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    } else if (e.key === 'Enter') {
      // Auto-indent: inherit previous line's leading whitespace
      const target = e.currentTarget;
      const start = target.selectionStart;
      const value = target.value;
      const currentLine = value.substring(0, start).split('\n').pop() || '';
      const match = currentLine.match(/^\s+/);
      const indent = match ? match[0] : '';

      if (indent.length > 0) {
        e.preventDefault();
        const newValue = value.substring(0, start) + '\n' + indent + value.substring(start);
        onCodeChange(activeFileIndex, newValue);

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1 + indent.length;
          }
        }, 0);
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      // Prevent browser save prompt
      e.preventDefault();
    }
  };

  // Handle Clipboard Paste Event & Forensic Telemetry
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    if (!text) return;

    const charCount = text.length;
    const isSuspicious = charCount > 75 || text.split('\n').length > 2;

    onPasteEvent?.(text, activeFile?.filename || 'code');

    if (isSuspicious) {
      setPasteNotice({ charCount, isSuspicious: true });
      setTimeout(() => setPasteNotice(null), 5000);
    }
  };

  // Block External File Drag-and-Drop (Prevent USB / local file transfer)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedName = e.dataTransfer.files[0].name;
      const msg = `External file drop blocked: "${droppedName}" (${e.dataTransfer.files[0].size} bytes)`;
      setDropBlockedNotice(msg);
      onExternalDropAttempt?.(msg);
      setTimeout(() => setDropBlockedNotice(null), 6000);
    }
  };

  // File icon helper
  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.html')) return <FileCode2 size={14} color="#f97316" />;
    if (filename.endsWith('.css')) return <FileCode size={14} color="#0284c7" />;
    if (filename.endsWith('.js')) return <Code2 size={14} color="#eab308" />;
    if (filename.endsWith('.py')) return <Terminal size={14} color="#10b981" />;
    if (filename.endsWith('.sql')) return <FileText size={14} color="#8b5cf6" />;
    return <FileCode size={14} color="#64748b" />;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0f172a',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid #1e293b',
        position: 'relative',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* File Tabs Navigation Bar */}
      <div
        style={{
          background: '#090d16',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 8px',
          userSelect: 'none',
        }}
      >
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', padding: '6px 0' }}>
          {files.map((file, idx) => {
            const isActive = idx === activeFileIndex;
            return (
              <button
                key={file.filename}
                type="button"
                onClick={() => onFileSelect(idx)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px 6px 0 0',
                  background: isActive ? '#0f172a' : 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #38bdf8' : '2px solid transparent',
                  color: isActive ? '#f8fafc' : '#94a3b8',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 600 : 500,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.1s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {getFileIcon(file.filename)}
                <span>{file.filename}</span>
              </button>
            );
          })}
        </div>

        {/* File Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onResetFile && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Reset ${activeFile?.filename} to its initial starter code? Any unsaved edits in this file will be lost.`)) {
                  onResetFile(activeFileIndex);
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.72rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '4px',
              }}
              title="Reset this file to original starter template"
            >
              <RotateCcw size={12} />
              <span>Reset File</span>
            </button>
          )}

          <span
            style={{
              fontSize: '0.7rem',
              color: '#38bdf8',
              background: '#082f49',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
            }}
          >
            {activeFile?.language || 'TEXT'}
          </span>
        </div>
      </div>

      {/* Forensic Telemetry Notice Banners */}
      {pasteNotice && (
        <div
          style={{
            background: '#451a03',
            borderBottom: '1px solid #78350f',
            color: '#fef3c7',
            padding: '6px 14px',
            fontSize: '0.74rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ClipboardPaste size={13} color="#f59e0b" />
            <span>
              External Paste Intercepted: <strong>{pasteNotice.charCount} characters</strong> inserted. Logged in digital integrity trail for examiner review.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setPasteNotice(null)}
            style={{ background: 'none', border: 'none', color: '#fef3c7', cursor: 'pointer', fontSize: '0.7rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {dropBlockedNotice && (
        <div
          style={{
            background: '#450a0a',
            borderBottom: '1px solid #991b1b',
            color: '#fee2e2',
            padding: '6px 14px',
            fontSize: '0.74rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <ShieldAlert size={14} color="#ef4444" />
          <span>{dropBlockedNotice}</span>
        </div>
      )}

      {/* Editor Main Canvas with Line Numbers */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          style={{
            width: '46px',
            background: '#090d16',
            color: '#475569',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            lineHeight: '1.5rem',
            padding: '12px 0',
            textAlign: 'right',
            paddingRight: '12px',
            overflowY: 'hidden',
            userSelect: 'none',
            borderRight: '1px solid #1e293b',
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>

        {/* Monospace Code Textarea */}
        <textarea
          ref={textareaRef}
          value={activeFile?.content || ''}
          onChange={(e) => onCodeChange(activeFileIndex, e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onScroll={handleScroll}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          style={{
            flex: 1,
            background: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.82rem',
            lineHeight: '1.5rem',
            padding: '12px 16px',
            border: 'none',
            outline: 'none',
            resize: 'none',
            overflowY: 'auto',
            whiteSpace: 'pre',
            tabSize: 2,
          }}
        />
      </div>

      {/* Editor Status Bar with Forensic Counter */}
      <div
        style={{
          background: '#090d16',
          borderTop: '1px solid #1e293b',
          padding: '4px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#64748b',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Lines: {lineCount}</span>
          <span>Chars: {(activeFile?.content || '').length}</span>
          <span>UTF-8</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Tab: 2 spaces</span>
          <span>Ctrl+S: Preview</span>
        </div>
      </div>
    </div>
  );
}
