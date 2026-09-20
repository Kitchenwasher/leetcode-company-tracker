import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { loadWhiteboardDrawing, saveWhiteboardDrawing } from '../services/storage';
import {
  PenTool, Circle, Square, ArrowRight, Eraser, RotateCcw, Download,
  Trash2, Check, Sparkles, Palette
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface WhiteboardCanvasProps {
  questionId: string | number;
  height?: number;
  isActive?: boolean;
}

type ToolMode = 'pen' | 'circle' | 'rect' | 'arrow' | 'eraser';

export const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({
  questionId,
  height = 420,
  isActive = true,
}) => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<ToolMode>('pen');
  const [color, setColor] = useState<string>('#E5FF00'); // default yellow
  const [lineWidth, setLineWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startX, setStartX] = useState<number>(0);
  const [startY, setStartY] = useState<number>(0);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  const colors = [
    { name: 'Cyber Yellow', value: '#E5FF00' },
    { name: 'Neon Lime', value: '#D4ED00' },
    { name: 'Amber Gold', value: '#F59E0B' },
    { name: 'White', value: '#f0f0f0' },
    { name: 'Light Grey', value: '#a0a0a0' },
    { name: 'Dark Grey', value: '#666666' },
    { name: 'Red', value: '#ff4757' },
  ];

  // Initialize and load stored sketch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions based on client bounding rect
    const rect = canvas.getBoundingClientRect();
    const parentW = canvas.parentElement?.clientWidth || 0;
    const computedWidth = rect.width > 0 ? rect.width : parentW > 0 ? parentW : 0;

    // If canvas is hidden or has 0 width, defer initialization until visible
    if (computedWidth <= 0) return;

    canvas.width = Math.round(computedWidth);
    canvas.height = height;

    // Fill background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle dot grid for diagramming
    ctx.fillStyle = '#2a2a2a';
    for (let x = 20; x < canvas.width; x += 24) {
      for (let y = 20; y < canvas.height; y += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Load saved drawing
    const saved = loadWhiteboardDrawing(questionId, user?.id);
    if (saved) {
      const img = new Image();
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0);
          saveHistoryState();
        } catch {}
      };
      img.src = saved;
    } else {
      saveHistoryState();
    }
  }, [questionId, user?.id, height, isActive]);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory((prev) => [...prev.slice(-15), state]);
    } catch (err) {
      console.warn('Unable to capture whiteboard snapshot:', err);
    }
  };

  const persistToStorage = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      saveWhiteboardDrawing(questionId, dataUrl, user?.id);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 1500);
    } catch {}
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartX(x);
    setStartY(y);
    try {
      setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    } catch {}

    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = tool === 'eraser' ? '#0a0a0a' : color;
      ctx.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (snapshot) {
      // Restore canvas before previewing shape
      ctx.putImageData(snapshot, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.beginPath();
        ctx.strokeRect(startX, startY, x - startX, y - startY);
      } else if (tool === 'arrow') {
        // Draw line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Draw arrow head
        const angle = Math.atan2(y - startY, x - startX);
        const headlen = 10;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - headlen * Math.cos(angle - Math.PI / 6), y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x, y);
        ctx.lineTo(x - headlen * Math.cos(angle + Math.PI / 6), y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveHistoryState();
    persistToStorage();
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHist = [...history];
    newHist.pop(); // Remove current
    const previous = newHist[newHist.length - 1];
    if (previous) {
      try {
        ctx.putImageData(previous, 0, 0);
        setHistory(newHist);
        persistToStorage();
        sounds.playClick();
      } catch {}
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Re-draw subtle grid
    ctx.fillStyle = '#2a2a2a';
    for (let x = 20; x < canvas.width; x += 24) {
      for (let y = 20; y < canvas.height; y += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    saveHistoryState();
    persistToStorage();
    sounds.playClick();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;
    try {
      const link = document.createElement('a');
      link.download = `diagram_problem_${questionId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      sounds.playClick();
    } catch {}
  };

  return (
    <div className="flex flex-col rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
      {/* Top Toolbar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-lg transition-colors ${
              tool === 'pen' ? 'bg-primary text-black font-bold text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pen / Freehand"
          >
            <PenTool className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('circle')}
            className={`p-1.5 rounded-lg transition-colors ${
              tool === 'circle' ? 'bg-primary text-black font-bold text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Tree / Graph Node (Circle)"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('rect')}
            className={`p-1.5 rounded-lg transition-colors ${
              tool === 'rect' ? 'bg-primary text-black font-bold text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Array / DP Cell (Box)"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('arrow')}
            className={`p-1.5 rounded-lg transition-colors ${
              tool === 'arrow' ? 'bg-primary text-black font-bold text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Pointer / Edge (Arrow)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-lg transition-colors ${
              tool === 'eraser' ? 'bg-primary text-black font-bold text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {colors.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-5 h-5 rounded-full transition-transform ${
                color === c.value ? 'scale-125 ring-2 ring-primary' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>

        {/* Stroke Width */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800 text-xs text-slate-400">
          <span>Width:</span>
          {[2, 4, 7].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setLineWidth(w)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                lineWidth === w ? 'bg-primary text-black font-bold text-white' : 'hover:text-white'
              }`}
            >
              {w}px
            </button>
          ))}
        </div>

        {/* Actions: Undo, Clear, Save Status, Download */}
        <div className="flex items-center gap-1.5">
          {savedToast && (
            <span className="text-[10px] font-semibold text-primary flex items-center gap-1 animate-fadeIn">
              <Check className="w-3 h-3" />
              Auto-Saved
            </span>
          )}

          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 disabled:opacity-30 transition-colors"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-error/15 border border-slate-800 hover:border-error/40 text-error transition-colors"
            title="Clear Board"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-primary hover:text-white transition-colors"
            title="Download PNG Diagram"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* HTML5 Canvas Area */}
      <div className="relative w-full bg-background cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full block"
          style={{ height: `${height}px` }}
        />
      </div>
    </div>
  );
};
