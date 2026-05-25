import React, { useRef, useEffect, useState } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (val: string) => void;
  onRun?: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, onRun }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCount = value.split("\n").length;
  const [activeLine, setActiveLine] = useState(0);

  // Sync line numbers scrolling with the textarea scrolling
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Support Tab key indentation inside browser editing area
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const originalValue = e.currentTarget.value;
      const newValue = originalValue.substring(0, start) + "    " + originalValue.substring(end);
      onChange(newValue);
      
      // Reset cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }

    // 2. Ctrl + Enter to quickly run Python code in the panel
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (onRun) onRun();
    }
  };

  const handleCursorMove = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textBeforeCursor = e.currentTarget.value.substring(0, e.currentTarget.selectionStart);
    const lineIndex = textBeforeCursor.split("\n").length - 1;
    setActiveLine(lineIndex);
  };

  return (
    <div className="flex h-full w-full bg-[#060911] border border-slate-800 rounded-xl overflow-hidden font-mono text-sm relative">
      {/* Line Numbers column */}
      <div 
        ref={lineNumbersRef}
        className="w-12 bg-[#0a0f1b] border-r border-slate-850 py-3 text-right pr-3 select-none text-slate-605 overflow-hidden text-xs"
        style={{ scrollbarWidth: "none" }}
      >
        {Array.from({ length: Math.max(1, lineCount) }).map((_, i) => (
          <div 
            key={i} 
            className={`h-5 leading-5 transition-colors duration-150 ${
              i === activeLine ? "text-emerald-400 font-semibold" : "text-slate-600"
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Actual Raw Interactive Text Area */}
      <div className="flex-grow h-full relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          onKeyUp={handleCursorMove}
          onClick={handleCursorMove}
          placeholder="# Введіть ваш Python код тут..."
          className="w-full h-full bg-transparent text-slate-100 p-3 resize-none outline-none overflow-auto font-mono text-sm leading-5 placeholder-slate-700"
          spellCheck="false"
          style={{ whiteSpace: "pre", wordWrap: "normal" }}
          id="editor-textarea"
        />
      </div>

      {/* Ctrl + Enter floating badge indicator at the bottom right */}
      <span className="absolute bottom-2 right-3 pointer-events-none text-[10px] text-slate-600 uppercase tracking-wider bg-[#080d15]/80 px-2 py-0.5 rounded border border-slate-800/40 select-none">
        Ctrl + Enter для запуску
      </span>
    </div>
  );
};
