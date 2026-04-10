import { PRESET_COLORS } from '../../constants/colors';

export default function RightPanel({
  color, setColor,
  strokeWidth, setStrokeWidth,
  opacity, setOpacity,
  canUndo, canRedo,
  onUndo, onRedo,
  onClear, onDownload,
}) {
  return (
    <aside className="right-panel">

      {/* ── Colors ──────────────────────────────────────────── */}
      <section className="rp-section">
        <div className="rp-label">Color</div>
        <div className="color-grid">
          {PRESET_COLORS.map(c => (
            <button key={c} className={`color-swatch${color === c ? ' selected' : ''}`}
              style={{ background: c, boxShadow: c === '#ffffff' ? 'inset 0 0 0 1px #30363d' : undefined }}
              onClick={() => setColor(c)}
              title={c}
            />
          ))}
        </div>
        <label className="rp-sub-label">Custom</label>
        <input type="color" value={color} onChange={e => setColor(e.target.value)}
          className="color-picker" />
        <div className="current-color-strip" style={{ background: color }}>
          <span>{color}</span>
        </div>
      </section>

      {/* ── Stroke Width ────────────────────────────────────── */}
      <section className="rp-section">
        <div className="rp-label">Stroke · {strokeWidth}px</div>
        <input type="range" min="1" max="30" value={strokeWidth}
          onChange={e => setStrokeWidth(+e.target.value)}
          className="rp-slider" />
        <div className="size-presets">
          {[1, 3, 6, 10, 18].map(n => (
            <button key={n} onClick={() => setStrokeWidth(n)}
              className={`size-btn${strokeWidth === n ? ' active' : ''}`}
              title={`${n}px`}>
              <div className="size-line" style={{ height: Math.min(n, 14) + 'px' }} />
            </button>
          ))}
        </div>
      </section>

      {/* ── Opacity ─────────────────────────────────────────── */}
      <section className="rp-section">
        <div className="rp-label">Opacity · {Math.round(opacity * 100)}%</div>
        <input type="range" min="0.05" max="1" step="0.05" value={opacity}
          onChange={e => setOpacity(+e.target.value)}
          className="rp-slider opacity-slider"
          style={{ '--track-color': color }}
        />
      </section>

      {/* ── Actions ─────────────────────────────────────────── */}
      <section className="rp-section">
        <div className="rp-label">Actions</div>
        <div className="action-grid">
          <button onClick={onUndo} disabled={!canUndo}
            className={`action-btn${!canUndo ? ' disabled' : ''}`}>
            ↩ Undo
          </button>
          <button onClick={onRedo} disabled={!canRedo}
            className={`action-btn${!canRedo ? ' disabled' : ''}`}>
            ↪ Redo
          </button>
          <button onClick={onClear} className="action-btn danger">
            🗑 Clear
          </button>
          <button onClick={onDownload} className="action-btn success">
            ⬇ Save PNG
          </button>
        </div>
      </section>

      {/* ── Info ────────────────────────────────────────────── */}
      <section className="rp-section rp-section--info">
        <div className="rp-label">Canvas</div>
        <div className="info-row"><span>Size</span><span>1600 × 900</span></div>
        <div className="info-row"><span>Format</span><span>PNG / WebM</span></div>
        <div className="info-row"><span>Tools</span><span>13 tools</span></div>
      </section>

    </aside>
  );
}