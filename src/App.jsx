import { useRef, useState, useEffect, useCallback } from 'react';
import Navbar             from './components/Navbar/Navbar';
import ToolPanel          from './components/ToolPanel/ToolPanel';
import RightPanel         from './components/RightPanel/RightPanel';
import CanvasBoard        from './components/CanvasBoard/CanvasBoard';
import ScreenShareViewer  from './components/ScreenShareViewer/ScreenShareViewer';
import StatusBar          from './components/StatusBar/StatusBar';
import { useHistory }     from './hooks/useHistory';
import { useScreenShare } from './hooks/useScreenShare';
import { useCanvas }      from './hooks/useCanvas';
import { DEFAULT_COLOR, DEFAULT_STROKE } from './constants/colors';
import { CANVAS_WIDTH, CANVAS_HEIGHT, STICKY_COLORS } from './constants/tools';
import './App.css';

export default function App() {
  /* ── Canvas refs ─────────────────────────────────────────────── */
  const canvasRef      = useRef(null);
  const overlayRef     = useRef(null);
  const laserCanvasRef = useRef(null);

  /* ── Tool state ──────────────────────────────────────────────── */
  const [activeTool,  setActiveTool]  = useState('pen');
  const [color,       setColor]       = useState(DEFAULT_COLOR);
  const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE);
  const [opacity,     setOpacity]     = useState(1);
  const [filled,      setFilled]      = useState(false);
  const [bgOption,    setBgOption]    = useState('white');

  /* ── Zoom / Pan ──────────────────────────────────────────────── */
  const [zoom,       setZoom]       = useState(1);
  const [panOffset,  setPanOffset]  = useState({ x: 0, y: 0 });

  /* ── Sticky notes ────────────────────────────────────────────── */
  const [stickyNotes, setStickyNotes] = useState([]);

  /* ── Room code ───────────────────────────────────────────────── */
  const [roomCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());

  /* ── History ─────────────────────────────────────────────────── */
  const { save, undo, redo, init, canUndo, canRedo } = useHistory(canvasRef);

  /* ── Screen Share ────────────────────────────────────────────── */
  const screenShare = useScreenShare(canvasRef);

  /* ── Canvas drawing ──────────────────────────────────────────── */
  const { onDown, onMove, onUp, commitText } = useCanvas({
    canvasRef, overlayRef, laserCanvasRef,
    activeTool, color, strokeWidth, opacity, filled,
    onSave: save,
  });

  /* ── Init blank canvas ───────────────────────────────────────── */
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    init();
  }, []);

  /* ── Keyboard shortcuts ──────────────────────────────────────── */
  useEffect(() => {
    const keyMap = {
      's': 'select', 'p': 'pen', 'h': 'marker', 'e': 'eraser',
      'q': 'laser',  'l': 'line', 'a': 'arrow',  'r': 'rect',
      'c': 'circle', 'd': 'diamond', 't': 'text', 'n': 'sticky', 'm': 'pan',
    };
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); redo(); return; }
      if (e.key === '+' || e.key === '=') { e.preventDefault(); setZoom(z => Math.min(z + 0.1, 3)); }
      if (e.key === '-') { e.preventDefault(); setZoom(z => Math.max(z - 0.1, 0.25)); }
      if (e.key === '0') { e.preventDefault(); setZoom(1); setPanOffset({ x: 0, y: 0 }); }
      if (keyMap[e.key]) setActiveTool(keyMap[e.key]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, init, save]);

  /* ── Mouse-wheel zoom ────────────────────────────────────────── */
  useEffect(() => {
    const handler = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom(z => Math.min(Math.max(z + delta, 0.25), 3));
    };
    window.addEventListener('wheel', handler, { passive: false });
    return () => window.removeEventListener('wheel', handler);
  }, []);

  /* ── Actions ─────────────────────────────────────────────────── */
  const clearCanvas = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = bgOption === 'black' ? '#0d1117' : '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    save();
  }, [bgOption, save]);

  const downloadPNG = useCallback(() => {
    const link = document.createElement('a');
    link.download = `classboard-${Date.now()}.png`;
    link.href = canvasRef.current?.toDataURL('image/png') ?? '';
    link.click();
  }, []);

  /* ── Sticky note management ──────────────────────────────────── */
  const addSticky = useCallback((screenX, screenY) => {
    const color = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
    setStickyNotes(prev => [...prev, {
      id: Date.now(), x: screenX - 80, y: screenY,
      text: '', color,
      rotation: (Math.random() - 0.5) * 4,
    }]);
  }, []);

  const handleCanvasDown = useCallback((e, onTextReq) => {
    onDown(e, (sx, sy, cx, cy, isSticky) => {
      if (isSticky) addSticky(sx, sy);
      else onTextReq(sx, sy, cx, cy);
    });
  }, [onDown, addSticky]);

  const moveStickyNote = (id, x, y) =>
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));

  const editStickyNote = (id, text) =>
    setStickyNotes(prev => prev.map(n => n.id === id ? { ...n, text } : n));

  const deleteStickyNote = (id) =>
    setStickyNotes(prev => prev.filter(n => n.id !== id));

  /* ─────────────────────────────────────────────────────────────── */
  return (
    <div className="app-root">
      <Navbar
        roomCode={roomCode}
        isSharing={screenShare.isSharing}
        isRecording={screenShare.isRecording}
        recordedURL={screenShare.recordedURL}
        onStartShare={screenShare.startShare}
        onStopShare={screenShare.stopShare}
        onStartRecording={screenShare.startRecording}
        onStopRecording={screenShare.stopRecording}
        onDownloadRecording={screenShare.downloadRecording}
        onProjectToCanvas={screenShare.projectToCanvas}
        bgOption={bgOption}
        onBgChange={setBgOption}
        zoom={zoom}
        onZoomIn={() => setZoom(z => Math.min(z + 0.15, 3))}
        onZoomOut={() => setZoom(z => Math.max(z - 0.15, 0.25))}
        onZoomReset={setZoom}
      />

      <div className="app-body">
        <ToolPanel
          activeTool={activeTool} setActiveTool={setActiveTool}
          filled={filled} setFilled={setFilled}
        />

        <CanvasBoard
          canvasRef={canvasRef} overlayRef={overlayRef} laserCanvasRef={laserCanvasRef}
          onDown={handleCanvasDown} onMove={onMove} onUp={onUp}
          onCommitText={commitText}
          activeTool={activeTool} color={color} strokeWidth={strokeWidth}
          bgOption={bgOption}
          zoom={zoom} panOffset={panOffset}
          stickyNotes={stickyNotes}
          onStickyMove={moveStickyNote}
          onStickyEdit={editStickyNote}
          onStickyDelete={deleteStickyNote}
        />

        <RightPanel
          color={color}       setColor={setColor}
          strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth}
          opacity={opacity}   setOpacity={setOpacity}
          canUndo={canUndo}   canRedo={canRedo}
          onUndo={undo}       onRedo={redo}
          onClear={clearCanvas}
          onDownload={downloadPNG}
        />
      </div>

      <StatusBar
        activeTool={activeTool} color={color}
        strokeWidth={strokeWidth} opacity={opacity} zoom={zoom}
        isSharing={screenShare.isSharing}
        isRecording={screenShare.isRecording}
      />

      {/* Floating PiP Screen Share Window */}
      <ScreenShareViewer
        videoRef={screenShare.videoRef}
        isSharing={screenShare.isSharing}
        isRecording={screenShare.isRecording}
        onStartRecording={screenShare.startRecording}
        onStopRecording={screenShare.stopRecording}
        onProjectToCanvas={screenShare.projectToCanvas}
        onStopShare={screenShare.stopShare}
        recordedURL={screenShare.recordedURL}
        onDownloadRecording={screenShare.downloadRecording}
      />

      {/* Error toast */}
      {screenShare.shareError && (
        <div className="error-toast">{screenShare.shareError}</div>
      )}
    </div>
  );
}