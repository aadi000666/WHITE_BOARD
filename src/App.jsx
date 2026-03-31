import React, { useState, useRef, useEffect } from 'react';
import './index.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pencil, 
  Square, 
  Circle as CircleIcon, 
  Minus, 
  Eraser, 
  Undo2, 
  Redo2, 
  Trash2, 
  Download, 
  Monitor,
  X,
  Type,
  MousePointer2
} from 'lucide-react';

function App() {
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(5);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(true);
  
  const canvasRef = useRef(null);
  const tempCanvasRef = useRef(null);
  const contextRef = useRef(null);
  const tempContextRef = useRef(null);
  const videoRef = useRef(null);

  const [history, setHistory] = useState([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const colors = [
    '#000000', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b',
    '#a855f7', '#ec4899', '#06b6d4', '#8b5cf6', '#64748b'
  ];

  // Initialize main canvas + hidden buffer canvas for shapes
  useEffect(() => {
    const initCanvas = (canvas, contextStateRef) => {
      canvas.width = window.innerWidth * 2;
      canvas.height = window.innerHeight * 2;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const context = canvas.getContext('2d');
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      contextStateRef.current = context;
      return context;
    };

    initCanvas(canvasRef.current, contextRef);
    initCanvas(tempCanvasRef.current, tempContextRef);

    // Initial base background
    contextRef.current.fillStyle = 'white';
    contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    saveToHistory();

    const handleResize = () => {
      // Re-init with history preservation logic... (simplified here for v2)
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const newState = canvas.toDataURL();
    const newHistory = history.slice(0, historyPointer + 1);
    newHistory.push(newState);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryPointer(newHistory.length - 1);
  };

  const undo = () => {
    if (historyPointer > 0) {
      const prevPointer = historyPointer - 1;
      restoreState(history[prevPointer]);
      setHistoryPointer(prevPointer);
    }
  };

  const redo = () => {
    if (historyPointer < history.length - 1) {
      const nextPointer = historyPointer + 1;
      restoreState(history[nextPointer]);
      setHistoryPointer(nextPointer);
    }
  };

  const restoreState = (dataUrl) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      contextRef.current.drawImage(img, 0, 0, window.innerWidth, window.innerHeight);
    };
  };

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    setStartPos({ x: offsetX, y: offsetY });
    
    if (tool === 'pencil' || tool === 'eraser') {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      contextRef.current.strokeStyle = tool === 'eraser' ? 'white' : color;
      contextRef.current.lineWidth = lineWidth;
    }
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    
    if (tool === 'pencil' || tool === 'eraser') {
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
    } else {
      // For shapes, we draw on the temp canvas and clear previous frame
      tempContextRef.current.clearRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);
      tempContextRef.current.strokeStyle = color;
      tempContextRef.current.lineWidth = lineWidth;
      tempContextRef.current.beginPath();
      
      if (tool === 'rect') {
        const width = offsetX - startPos.x;
        const height = offsetY - startPos.y;
        tempContextRef.current.rect(startPos.x, startPos.y, width, height);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(offsetX - startPos.x, 2) + Math.pow(offsetY - startPos.y, 2));
        tempContextRef.current.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      } else if (tool === 'line') {
        tempContextRef.current.moveTo(startPos.x, startPos.y);
        tempContextRef.current.lineTo(offsetX, offsetY);
      }
      tempContextRef.current.stroke();
    }
  };

  const finishDrawing = () => {
    if (!isDrawing) return;
    
    if (tool !== 'pencil' && tool !== 'eraser') {
      // Commit shape from temp canvas to main canvas
      contextRef.current.drawImage(tempCanvasRef.current, 0, 0, window.innerWidth, window.innerHeight);
      tempContextRef.current.clearRect(0, 0, tempCanvasRef.current.width, tempCanvasRef.current.height);
    }
    
    setIsDrawing(false);
    saveToHistory();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      const tracks = videoRef.current.srcObject?.getTracks();
      tracks?.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        videoRef.current.srcObject = stream;
        setIsScreenSharing(true);
        stream.getVideoTracks()[0].onended = () => setIsScreenSharing(false);
      } catch (err) {
        console.error("Screen Share Failed:", err);
      }
    }
  };

  return (
    <div className="app-container">
      {/* Premium Animated Toolbar */}
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
        className="toolbar glass"
      >
        <div className="tool-group" style={{ paddingRight: '12px' }}>
          <motion.h1 
            whileHover={{ scale: 1.05 }}
            className="brand" 
            style={{ fontSize: '18px', fontWeight: '800', background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            EduBoard <span style={{ color: 'var(--text-secondary)', fontSize: '10px', verticalAlign: 'middle', WebkitTextFillColor: '#94a3b8' }}>PRO</span>
          </motion.h1>
        </div>
        
        <div className="tool-group">
          <ToolButton active={tool === 'pencil'} onClick={() => setTool('pencil')} icon={<Pencil size={20} />} label="Pencil" />
          <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser size={20} />} label="Eraser" />
          <ToolButton active={tool === 'rect'} onClick={() => setTool('rect')} icon={<Square size={20} />} label="Rectangle" />
          <ToolButton active={tool === 'circle'} onClick={() => setTool('circle')} icon={<CircleIcon size={20} />} label="Circle" />
          <ToolButton active={tool === 'line'} onClick={() => setTool('line')} icon={<Minus size={20} />} label="Line" />
        </div>

        <div className="tool-group">
          <ToolButton onClick={undo} disabled={historyPointer <= 0} icon={<Undo2 size={20} />} label="Undo" />
          <ToolButton onClick={redo} disabled={historyPointer >= history.length - 1} icon={<Redo2 size={20} />} label="Redo" />
          <ToolButton onClick={clearCanvas} icon={<Trash2 size={20} />} label="Clear All" variant="danger" />
        </div>

        <div className="tool-group" style={{ borderRight: 'none' }}>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary" 
            onClick={downloadImage}
          >
            <Download size={18} />
            <span>Export</span>
          </motion.button>
          
          <ToolButton 
            active={isScreenSharing} 
            onClick={toggleScreenShare} 
            icon={<Monitor size={20} />} 
            label="Share Screen" 
            className="screen-share-btn"
          />
        </div>
      </motion.div>

      {/* Main Drawing Layer */}
      <div className="canvas-container">
        <canvas
          id="whiteboard"
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
        />
        {/* Transparent shape preview layer */}
        <canvas
          id="temp-canvas"
          ref={tempCanvasRef}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: isDrawing ? 'none' : 'auto' }}
          onMouseDown={startDrawing}
          onMouseUp={finishDrawing}
          onMouseMove={draw}
        />
      </div>

      {/* Sidebar Controls with Menu Animation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 200, opacity: 0 }}
            className="controls-overlay"
          >
            <div className="control-card glass">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Properties</h3>
              </div>
              
              <div className="color-grid">
                {colors.map(c => (
                  <motion.div 
                    key={c}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`color-swatch ${color === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>

              <div className="slider-container">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label>Brush Size</label>
                  <span style={{ fontSize: '12px', color: 'var(--accent-color)' }}>{lineWidth}px</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="40" 
                  value={lineWidth} 
                  onChange={(e) => setLineWidth(parseInt(e.target.value))} 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen Share Overlay */}
      <AnimatePresence>
        {isScreenSharing && (
          <motion.div 
            drag
            dragConstraints={{ left: 0, right: window.innerWidth - 320, top: 0, bottom: window.innerHeight - 180 }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="screen-share-overlay glass"
            style={{ cursor: 'move' }}
          >
            <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 10 }}>
              <button 
                className="tool-btn active" 
                style={{ padding: '6px' }}
                onClick={toggleScreenShare}
              >
                <X size={14} />
              </button>
            </div>
            <video ref={videoRef} autoPlay playsInline muted />
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', pointerEvents: 'none', fontSize: '10px', opacity: 0.6 }}>
              Drag to move preview
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-component for Tool Buttons to handle animations
const ToolButton = ({ active, icon, onClick, label, disabled, variant, className }) => (
  <motion.button 
    title={label}
    disabled={disabled}
    whileHover={{ y: -2, scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className={`tool-btn ${active ? 'active' : ''} ${variant === 'danger' ? 'hover-danger' : ''} ${className || ''}`}
    onClick={onClick}
    style={{ opacity: disabled ? 0.3 : 1 }}
  >
    {icon}
  </motion.button>
);

export default App;
