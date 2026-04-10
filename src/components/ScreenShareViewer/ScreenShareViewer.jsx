import { useRef, useState, useEffect } from 'react';

export default function ScreenShareViewer({
  videoRef, isSharing,
  isRecording, onStartRecording, onStopRecording,
  onProjectToCanvas, onStopShare,
  recordedURL, onDownloadRecording,
}) {
  const [pos, setPos]         = useState({ x: 20, y: 60 });
  const [size, setSize]       = useState({ w: 360, h: 220 });
  const [minimized, setMin]   = useState(false);
  const [mirrored, setMirror] = useState(false);
  const dragRef   = useRef(false);
  const origin    = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  /* ── Dragging ────────────────────────────────────────────── */
  const startDrag = (e) => {
    dragRef.current = true;
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    window.addEventListener('mousemove', onDrag);
    window.addEventListener('mouseup', endDrag);
  };
  const onDrag = (e) => {
    if (!dragRef.current) return;
    setPos({
      x: Math.max(0, origin.current.px + e.clientX - origin.current.mx),
      y: Math.max(0, origin.current.py + e.clientY - origin.current.my),
    });
  };
  const endDrag = () => {
    dragRef.current = false;
    window.removeEventListener('mousemove', onDrag);
    window.removeEventListener('mouseup', endDrag);
  };

  if (!isSharing) return null;

  return (
    <div
      className={`pip-window${minimized ? ' minimized' : ''}`}
      style={{ left: pos.x, top: pos.y, width: minimized ? 200 : size.w }}
    >
      {/* Header bar */}
      <div className="pip-header" onMouseDown={startDrag}>
        <div className="pip-header-left">
          <span className="pip-live-dot" />
          <span className="pip-title">Screen Share</span>
        </div>
        <div className="pip-header-right" onMouseDown={e => e.stopPropagation()}>
          <button className="pip-icon-btn" title={mirrored ? 'Unmirror' : 'Mirror'}
            onClick={() => setMirror(m => !m)}>⇄</button>
          <button className="pip-icon-btn" title={minimized ? 'Expand' : 'Minimize'}
            onClick={() => setMin(m => !m)}>{minimized ? '▲' : '▼'}</button>
          <button className="pip-icon-btn pip-close" title="Stop sharing"
            onClick={onStopShare}>✕</button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Video feed */}
          <div className="pip-video-wrap">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="pip-video"
              style={{ transform: mirrored ? 'scaleX(-1)' : undefined }}
            />
            {/* Overlay controls on hover */}
            <div className="pip-overlay">
              <button className="pip-overlay-btn" onClick={onProjectToCanvas}
                title="Snapshot this frame to whiteboard">
                📸 Project to Board
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="pip-controls">
            <div className="pip-controls-left">
              {!isRecording ? (
                <button className="pip-ctrl-btn record" onClick={onStartRecording}>
                  ⏺ Record
                </button>
              ) : (
                <button className="pip-ctrl-btn record active" onClick={onStopRecording}>
                  ⏹ Stop
                </button>
              )}
              {recordedURL && (
                <button className="pip-ctrl-btn dl" onClick={onDownloadRecording}>
                  ⬇ Save Video
                </button>
              )}
            </div>
            <button className="pip-ctrl-btn stop" onClick={onStopShare}>
              ✕ End
            </button>
          </div>

          {isRecording && (
            <div className="pip-recording-bar">
              <span className="rec-dot" />
              <span>Recording…</span>
              <span className="rec-tip">Click "Stop" when done</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}