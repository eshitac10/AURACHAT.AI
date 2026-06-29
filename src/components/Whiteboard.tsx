import React, { useRef, useState, useEffect, MouseEvent, TouchEvent } from 'react';
import { motion } from 'motion/react';
import { DrawingPath, DrawingPoint, CollaborationUser } from '../types';
import { Paintbrush, Minus, Square, Circle, Eraser, Trash2, Users, Download, Sparkles, ArrowLeft } from 'lucide-react';

interface WhiteboardProps {
  paths: DrawingPath[];
  peers: CollaborationUser[];
  userId: string;
  userColor: string;
  userName: string;
  onSendStroke: (type: string, payload: any) => void;
  onTriggerBadge: (badgeId: string) => void;
  theme?: string;
  onBack?: () => void;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  paths,
  peers,
  userId,
  userColor,
  userName,
  onSendStroke,
  onTriggerBadge,
  theme = 'light',
  onBack
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [tool, setTool] = useState<'pen' | 'line' | 'rect' | 'circle' | 'eraser'>('pen');
  const [color, setColor] = useState<string>(userColor);
  const [width, setWidth] = useState<number>(4);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentPathId, setCurrentPathId] = useState<string | null>(null);
  const [currentPoints, setCurrentPoints] = useState<DrawingPoint[]>([]);

  const activeToolClass =
    theme === 'pink'
      ? 'text-pink-600 dark:text-pink-400'
      : theme === 'dark'
      ? 'text-violet-400'
      : 'text-zinc-900';

  const ringClass =
    theme === 'pink'
      ? 'ring-pink-500'
      : theme === 'dark'
      ? 'ring-violet-500'
      : 'ring-zinc-800';

  const sliderAccentClass =
    theme === 'pink'
      ? 'accent-pink-500'
      : theme === 'dark'
      ? 'accent-violet-500'
      : 'accent-zinc-800';

  const drawpadBgClass =
    theme === 'pink'
      ? 'bg-zinc-50/50 dark:bg-[#0c040a]'
      : theme === 'dark'
      ? 'bg-zinc-950'
      : 'bg-zinc-50/50';

  const dotColor =
    theme === 'pink'
      ? 'rgba(219,39,119,0.15)'
      : theme === 'dark'
      ? 'rgba(139,92,246,0.12)'
      : 'rgba(0,0,0,0.06)';

  // Keep colors list matching light, dark, and pink themes
  const colors = [
    '#ec4899', // Pink
    '#f43f5e', // Rose
    '#8b5cf6', // Violet
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#000000', // Black
    '#ffffff', // White
  ];

  // Draw everything onto the canvas whenever paths change or resizing occurs
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear whole canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed and in-progress paths
    paths.forEach((path) => {
      if (path.points.length === 0) return;

      ctx.beginPath();
      ctx.strokeStyle = path.tool === 'eraser' ? '#ffffff' : path.color; // Eraser draws white
      if (path.tool === 'eraser' && document.documentElement.classList.contains('dark')) {
        ctx.strokeStyle = '#09090b'; // Eraser matches zinc-950 in dark mode
      }
      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const firstPoint = path.points[0];

      if (path.tool === 'pen' || path.tool === 'eraser') {
        ctx.moveTo(firstPoint.x, firstPoint.y);
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y);
        }
        ctx.stroke();
      } else if (path.tool === 'line') {
        const lastPoint = path.points[path.points.length - 1];
        ctx.moveTo(firstPoint.x, firstPoint.y);
        ctx.lineTo(lastPoint.x, lastPoint.y);
        ctx.stroke();
      } else if (path.tool === 'rect') {
        const lastPoint = path.points[path.points.length - 1];
        const w = lastPoint.x - firstPoint.x;
        const h = lastPoint.y - firstPoint.y;
        ctx.strokeRect(firstPoint.x, firstPoint.y, w, h);
      } else if (path.tool === 'circle') {
        const lastPoint = path.points[path.points.length - 1];
        const radius = Math.sqrt(
          Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2)
        );
        ctx.arc(firstPoint.x, firstPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });

    // Draw active local path separately to ensure ultra-low latency
    if (isDrawing && currentPoints.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      if (tool === 'eraser' && document.documentElement.classList.contains('dark')) {
        ctx.strokeStyle = '#09090b';
      }
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const firstPoint = currentPoints[0];

      if (tool === 'pen' || tool === 'eraser') {
        ctx.moveTo(firstPoint.x, firstPoint.y);
        for (let i = 1; i < currentPoints.length; i++) {
          ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
        }
        ctx.stroke();
      } else if (tool === 'line') {
        const lastPoint = currentPoints[currentPoints.length - 1];
        ctx.moveTo(firstPoint.x, firstPoint.y);
        ctx.lineTo(lastPoint.x, lastPoint.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        const lastPoint = currentPoints[currentPoints.length - 1];
        const w = lastPoint.x - firstPoint.x;
        const h = lastPoint.y - firstPoint.y;
        ctx.strokeRect(firstPoint.x, firstPoint.y, w, h);
      } else if (tool === 'circle') {
        const lastPoint = currentPoints[currentPoints.length - 1];
        const radius = Math.sqrt(
          Math.pow(lastPoint.x - firstPoint.x, 2) + Math.pow(lastPoint.y - firstPoint.y, 2)
        );
        ctx.arc(firstPoint.x, firstPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
  };

  // Resize canvas handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Make canvas match its HTML container bounds
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight || 450;
      drawCanvas();
    };

    handleResize();

    // Use a small timeout to let the container render fully before measuring
    const timeoutId = setTimeout(handleResize, 100);

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [paths]);

  // Redraw when local state variables change
  useEffect(() => {
    drawCanvas();
  }, [paths, currentPoints, isDrawing, color, tool, width]);

  // Handle Coordinates extraction
  const getCoordinates = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>): DrawingPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Return exact coordinate mapped on the canvas width/height resolution
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  // Drawing Actions
  const handleStartDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    const pathId = Math.random().toString(36).substring(2, 9);
    setCurrentPathId(pathId);
    const initialPoints = [coords];
    setCurrentPoints(initialPoints);

    // Broadcast stroke start to peer websocket
    onSendStroke('draw_start', {
      id: pathId,
      userId,
      userColor,
      tool,
      color,
      width,
      points: initialPoints,
    });
  };

  const handleDrawingMove = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const coords = getCoordinates(e);
    if (!coords) return;

    // Track peer cursor movement
    onSendStroke('cursor_move', {
      userId,
      name: userName,
      color: userColor,
      cursorX: coords.x,
      cursorY: coords.y,
    });

    if (!isDrawing || !currentPathId) return;

    let updatedPoints: DrawingPoint[] = [];
    if (tool === 'pen' || tool === 'eraser') {
      updatedPoints = [...currentPoints, coords];
    } else {
      // Shape-drawing only needs start coordinate (first) and current coordinate (last)
      updatedPoints = [currentPoints[0], coords];
    }

    setCurrentPoints(updatedPoints);

    // Send drawing move event (delta point update)
    onSendStroke('draw_move', {
      pathId: currentPathId,
      point: coords,
      tool, // Send tool so server knows how to append (shapes replace last, pen appends)
    });
  };

  const handleEndDrawing = () => {
    if (!isDrawing || !currentPathId) return;

    setIsDrawing(false);

    // Finalize path broadcast
    onSendStroke('draw_end', {
      pathId: currentPathId,
    });

    setCurrentPathId(null);
    setCurrentPoints([]);

    // Reward for canvas creation
    onTriggerBadge('canvas_creator');
  };

  // Clear Canvas broadcast
  const handleClear = () => {
    if (window.confirm('Clear whiteboard for all connected peers?')) {
      onSendStroke('clear_board', {});
    }
  };

  // Download Board snapshot
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `AuraBoard-Canvas-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm overflow-hidden">
      {/* Collaboration Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-4 gap-4 bg-zinc-50/50 dark:bg-zinc-900/10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800/50 transition-colors"
              title="Back to Chat"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              Shared AuraBoard <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Brainstorm and draw on a unified real-time creative canvas
            </p>
          </div>
        </div>

        {/* Peers List */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-zinc-500" />
            Active:
          </span>
          <div className="flex -space-x-1 overflow-hidden">
            <span
              className="inline-block h-6 px-2 rounded-md text-[10px] font-bold text-white leading-6 border border-white dark:border-zinc-950 uppercase"
              style={{ backgroundColor: userColor }}
              title={`${userName} (You)`}
            >
              You
            </span>
            {peers.map((peer) => (
              <span
                key={peer.id}
                className="inline-block h-6 px-2 rounded-md text-[10px] font-bold text-white leading-6 border border-white dark:border-zinc-950 uppercase"
                style={{ backgroundColor: peer.color }}
                title={peer.name}
              >
                {peer.name.substring(0, 3)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbox bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/5">
        {/* Tool Selector */}
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
          <button
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-md transition-all ${
              tool === 'pen'
                ? `bg-white dark:bg-zinc-800 shadow-sm ${activeToolClass}`
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
            title="Brush"
          >
            <Paintbrush className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('line')}
            className={`p-1.5 rounded-md transition-all ${
              tool === 'line'
                ? `bg-white dark:bg-zinc-800 shadow-sm ${activeToolClass}`
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
            title="Straight Line"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('rect')}
            className={`p-1.5 rounded-md transition-all ${
              tool === 'rect'
                ? `bg-white dark:bg-zinc-800 shadow-sm ${activeToolClass}`
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
            title="Rectangle"
          >
            <Square className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-1.5 rounded-md transition-all ${
              tool === 'circle'
                ? `bg-white dark:bg-zinc-800 shadow-sm ${activeToolClass}`
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
            title="Circle"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-md transition-all ${
              tool === 'eraser'
                ? `bg-white dark:bg-zinc-800 shadow-sm ${activeToolClass}`
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
            }`}
            title="Eraser"
          >
            <Eraser className="w-4 h-4" />
          </button>
        </div>

        {/* Color Palette (Disabled if Eraser is active) */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-lg">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                if (tool === 'eraser') setTool('pen');
              }}
              disabled={tool === 'eraser'}
              className={`w-5 h-5 rounded-md transition-transform relative ${
                color === c && tool !== 'eraser' ? `scale-110 ring-2 ${ringClass} ring-offset-1 dark:ring-offset-zinc-950` : 'hover:scale-105'
              } ${tool === 'eraser' ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Width Control */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-mono font-bold text-zinc-400">
            Size
          </span>
          <input
            type="range"
            min="1"
            max="20"
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
            className={`w-24 ${sliderAccentClass} h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg cursor-pointer`}
          />
          <span className="text-xs font-mono text-zinc-500 w-4">{width}px</span>
        </div>

        {/* Clear and Download actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-800 transition-colors"
            title="Download canvas snapshot"
          >
            <Download className="w-3.5 h-3.5" />
            Save
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-950/30 transition-colors"
            title="Reset Canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Active Drawpad Area */}
      <div
        ref={containerRef}
        className={`flex-grow w-full relative select-none touch-none min-h-[300px] ${drawpadBgClass}`}
        style={{
          backgroundImage: `radial-gradient(circle, ${dotColor} 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleStartDrawing}
          onMouseMove={handleDrawingMove}
          onMouseUp={handleEndDrawing}
          onMouseLeave={handleEndDrawing}
          onTouchStart={handleStartDrawing}
          onTouchMove={handleDrawingMove}
          onTouchEnd={handleEndDrawing}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Real-time peer cursors floated over drawing board */}
        {peers.map((peer) => {
          if (peer.cursorX === undefined || peer.cursorY === undefined) return null;
          // Scale relative coordinates to client view bounding box
          const canvas = canvasRef.current;
          if (!canvas) return null;
          const rect = canvas.getBoundingClientRect();
          const scaleX = rect.width / canvas.width;
          const scaleY = rect.height / canvas.height;

          const clientX = peer.cursorX * scaleX;
          const clientY = peer.cursorY * scaleY;

          return (
            <div
              key={peer.id}
              className="absolute pointer-events-none transition-all duration-100 ease-out z-20 flex flex-col items-start"
              style={{
                left: `${clientX}px`,
                top: `${clientY}px`,
              }}
            >
              {/* Cursor SVG */}
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 drop-shadow"
                style={{ fill: peer.color, color: '#fff' }}
              >
                <path d="M10.07 14.24l-3.35 1.76L6 6l10 4-4.17 1.76-1.76 2.48z" />
              </svg>
              {/* Cursor Name Tag */}
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-extrabold text-white uppercase tracking-wider font-mono select-none"
                style={{ backgroundColor: peer.color }}
              >
                {peer.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
