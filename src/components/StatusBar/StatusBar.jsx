import { TOOLS } from '../../constants/tools';

export default function StatusBar({ activeTool, color, strokeWidth, opacity, zoom, isSharing, isRecording }) {
  const tool = TOOLS.find(t => t.id === activeTool);
  return (
    <div className="status-bar">
      <div className="sb-item">
        <span className="sb-key">Tool</span>
        <span className="sb-val sb-accent">{tool?.icon} {tool?.label}</span>
      </div>
      <div className="sb-sep" />
      <div className="sb-item">
        <span className="sb-key">Color</span>
        <div className="sb-color" style={{ background: color, boxShadow: color === '#ffffff' ? 'inset 0 0 0 1px #30363d' : undefined }} />
        <span className="sb-mono">{color}</span>
      </div>
      <div className="sb-sep" />
      <div className="sb-item">
        <span className="sb-key">Size</span>
        <span className="sb-mono">{strokeWidth}px</span>
      </div>
      <div className="sb-sep" />
      <div className="sb-item">
        <span className="sb-key">Opacity</span>
        <span className="sb-mono">{Math.round(opacity * 100)}%</span>
      </div>
      <div className="sb-sep" />
      <div className="sb-item">
        <span className="sb-key">Zoom</span>
        <span className="sb-mono">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="sb-right">
        {isRecording && (
          <div className="sb-badge badge-rec">
            <span className="rec-dot" /> REC
          </div>
        )}
        {isSharing && (
          <div className="sb-badge badge-live">
            <span className="live-dot" /> LIVE
          </div>
        )}
        <span className="sb-canvas">Canvas 1600 × 900</span>
      </div>
    </div>
  );
}