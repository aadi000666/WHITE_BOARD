import { TOOLS } from '../../constants/tools';

export default function ToolPanel({ activeTool, setActiveTool, filled, setFilled }) {
  return (
    <aside className="tool-panel">
      <div className="tool-section">
        {TOOLS.map(t => (
          <button
            key={t.id}
            className={`tool-btn${activeTool === t.id ? ' active' : ''}`}
            onClick={() => setActiveTool(t.id)}
            title={`${t.label}  [${t.key.toUpperCase()}]`}
          >
            <span className="tool-icon"
              style={{ fontFamily: t.id === 'text' ? "'Outfit',sans-serif" : 'inherit',
                       fontWeight: t.id === 'text' ? 700 : 400 }}>
              {t.icon}
            </span>
            <span className="tool-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="tool-divider" />

      {/* Fill toggle for shapes */}
      <div className="tool-section">
        <button
          className={`tool-btn fill-toggle${filled ? ' active' : ''}`}
          onClick={() => setFilled(f => !f)}
          title="Toggle fill for shapes"
        >
          <span className="tool-icon">{filled ? '▪' : '▫'}</span>
          <span className="tool-label">{filled ? 'Filled' : 'Outline'}</span>
        </button>
      </div>

      {/* Key hint */}
      <div className="tool-hint">
        <span>Keyboard</span>
        <span>shortcuts</span>
        <span>↓</span>
        {TOOLS.map(t => (
          <div key={t.id} className="hint-row">
            <kbd>{t.key.toUpperCase()}</kbd>
            <span>{t.label.split('/')[0].trim()}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}