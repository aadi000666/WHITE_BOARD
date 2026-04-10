import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants/tools';

export default function CanvasBoard({
  canvasRef, overlayRef, laserCanvasRef,
  onDown, onMove, onUp,
  onCommitText,
  activeTool, color, strokeWidth,
  bgOption, zoom, panOffset,
  onPanStart, onPanMove, onPanEnd,
  stickyNotes, onStickyMove, onStickyEdit, onStickyDelete,
}) {
  const [textInput, setTextInput] = useState(null); // { screenX, screenY, cx, cy }
  const [textValue, setTextValue] = useState('');
  const fontSize = Math.max(14, strokeWidth * 3 + 12);

  const handleDown = useCallback((e) => {
    onDown(e, (sx, sy, cx, cy) => {
      setTextInput({ screenX: sx, screenY: sy, cx, cy });
      setTextValue('');
    });
  }, [onDown]);

  const submitText = () => {
    if (textInput) {
      onCommitText(textValue, textInput.cx, textInput.cy, fontSize);
    }
    setTextInput(null);
    setTextValue('');
  };

  const cursorMap = {
    eraser: 'cell', text: 'text',
    pan: 'grab', select: 'default', laser: 'none',
  };
  const cursor = cursorMap[activeTool] || 'crosshair';

  return (
    <div className="canvas-area">
      {/* Background pattern layer */}
      <div className="canvas-bg-wrapper">
        {bgOption === 'grid' && <div className="bg-grid" />}
        {bgOption === 'dots' && <div className="bg-dots" />}
        {bgOption === 'lined' && <div className="bg-lined" />}
      </div>

      {/* Zoom + Pan wrapper */}
      <div
        className="canvas-transform-wrapper"
        style={{ transform: `scale(${zoom}) translate(${panOffset.x}px, ${panOffset.y}px)` }}
      >
        <div className="canvas-shadow-wrap">
          {/* Main drawing canvas */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="main-canvas"
            style={{ background: bgOption === 'black' ? '#0d1117' : '#ffffff' }}
          />

          {/* Overlay canvas (shape preview) */}
          <canvas
            ref={overlayRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="overlay-canvas"
            style={{ cursor }}
            onMouseDown={handleDown}
            onMouseMove={onMove}
            onMouseUp={onUp}
            onMouseLeave={onUp}
            onTouchStart={handleDown}
            onTouchMove={onMove}
            onTouchEnd={onUp}
          />

          {/* Laser pointer canvas */}
          <canvas
            ref={laserCanvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="laser-canvas"
            style={{ pointerEvents: 'none' }}
          />

          {/* Sticky Notes */}
          {stickyNotes.map(note => (
            <StickyNoteEl
              key={note.id}
              note={note}
              onMove={onStickyMove}
              onEdit={onStickyEdit}
              onDelete={onStickyDelete}
            />
          ))}
        </div>
      </div>

      {/* Text input floating box */}
      {textInput && (
        <div
          className="text-input-popup"
          style={{ top: textInput.screenY - 50, left: textInput.screenX }}
        >
          <input
            autoFocus
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitText(); if (e.key === 'Escape') setTextInput(null); }}
            placeholder="Type here… Enter to place"
            className="text-input-field"
            style={{ color, fontSize: Math.min(fontSize, 24) + 'px' }}
          />
          <button onClick={submitText} className="text-input-btn">Place ↵</button>
        </div>
      )}

      {/* Zoom badge */}
      <div className="zoom-badge">{Math.round(zoom * 100)}%</div>
    </div>
  );
}

/* ── Inline Sticky Note ──────────────────────────────────────────── */
function StickyNoteEl({ note, onMove, onEdit, onDelete }) {
  const dragging = useRef(false);
  const origin   = useRef({ mx: 0, my: 0, nx: 0, ny: 0 });

  const startDrag = (e) => {
    dragging.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, nx: note.x, ny: note.y };
    window.addEventListener('mousemove', drag);
    window.addEventListener('mouseup', endDrag);
  };
  const drag = (e) => {
    if (!dragging.current) return;
    onMove(note.id,
      origin.current.nx + (e.clientX - origin.current.mx),
      origin.current.ny + (e.clientY - origin.current.my)
    );
  };
  const endDrag = () => {
    dragging.current = false;
    window.removeEventListener('mousemove', drag);
    window.removeEventListener('mouseup', endDrag);
  };

  return (
    <div
      className="sticky"
      style={{ left: note.x, top: note.y, background: note.color, '--rotation': note.rotation + 'deg' }}
      onMouseDown={startDrag}
    >
      <div className="sticky-header">
        <div className="sticky-drag-handle">⠿</div>
        <button className="sticky-del" onClick={() => onDelete(note.id)}>✕</button>
      </div>
      <textarea
        value={note.text}
        onChange={e => onEdit(note.id, e.target.value)}
        className="sticky-text"
        onMouseDown={e => e.stopPropagation()}
        placeholder="Write here…"
        rows={4}
      />
    </div>
  );
}