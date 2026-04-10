import { useState } from 'react';

export default function Navbar({
  roomCode,
  isSharing, isRecording, recordedURL,
  onStartShare, onStopShare,
  onStartRecording, onStopRecording, onDownloadRecording,
  onProjectToCanvas,
  bgOption, onBgChange,
  zoom, onZoomIn, onZoomOut, onZoomReset,
}) {
  const [copied, setCopied] = useState(false);
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  const copyRoom = () => {
    const shareUrl = window.location.origin + window.location.pathname;
    navigator.clipboard.writeText(
      `Join my WHITE_BOARD session! Room Code: ${roomCode}\nLink: ${shareUrl}`
    ).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <nav className="navbar">
      {/* Brand */}
      <div className="nav-brand">
        <div className="nav-logo">🎨</div>
        <div className="nav-title-wrap">
          <span className="nav-title">WHITE_BOARD AI</span>
          <span className="nav-sub">Premium Collaborative Workspace</span>
        </div>
      </div>

      {/* Center Controls */}
      <div className="nav-center">
        {/* Zoom */}
        <div className="nav-group">
          <button className="nav-btn" onClick={onZoomOut} title="Zoom Out">−</button>
          <button className="nav-btn zoom-display"
            onClick={() => setShowZoomMenu(m => !m)}
            title="Zoom level">
            {Math.round(zoom * 100)}%
          </button>
          <button className="nav-btn" onClick={onZoomIn} title="Zoom In">+</button>
          {showZoomMenu && (
            <div className="dropdown">
              {[0.5, 0.75, 1, 1.25, 1.5, 2].map(z => (
                <button key={z} className="dropdown-item"
                  onClick={() => { onZoomReset(z); setShowZoomMenu(false); }}>
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="nav-divider" />

        {/* Background */}
        <div className="nav-group" style={{ position: 'relative' }}>
          <button className="nav-btn nav-btn--text"
            onClick={() => setShowBgMenu(m => !m)}>
            Background ▾
          </button>
          {showBgMenu && (
            <div className="dropdown">
              {['white', 'black', 'grid', 'dots', 'lined'].map(bg => (
                <button key={bg} className={`dropdown-item${bgOption === bg ? ' active' : ''}`}
                  onClick={() => { onBgChange(bg); setShowBgMenu(false); }}>
                  {bg.charAt(0).toUpperCase() + bg.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="nav-right">
        {/* Room code */}
        <div className="room-badge">
          <span className="room-label">Room</span>
          <span className="room-code">{roomCode}</span>
        </div>
        <button className={`nav-btn nav-btn--outline${copied ? ' copied' : ''}`}
          onClick={copyRoom} title="Copy invite link">
          {copied ? '✓ Copied!' : '🔗 Invite'}
        </button>

        <div className="nav-divider" />

        {/* Screen Share */}
        {!isSharing ? (
          <button className="nav-btn nav-btn--share" onClick={onStartShare}>
            🖥 Share Screen
          </button>
        ) : (
          <div className="share-controls">
            <span className="live-dot" />
            <span className="live-label">LIVE</span>
            <button className="nav-btn nav-btn--sm" onClick={onProjectToCanvas}
              title="Snapshot screen to canvas">
              📸 Snapshot
            </button>
            {!isRecording ? (
              <button className="nav-btn nav-btn--record" onClick={onStartRecording}>
                ⏺ Record
              </button>
            ) : (
              <button className="nav-btn nav-btn--record recording" onClick={onStopRecording}>
                ⏹ Stop Rec
              </button>
            )}
            <button className="nav-btn nav-btn--stop" onClick={onStopShare}>
              ✕ Stop Share
            </button>
          </div>
        )}

        {recordedURL && (
          <button className="nav-btn nav-btn--dl" onClick={onDownloadRecording}>
            ⬇ Download Recording
          </button>
        )}
      </div>
    </nav>
  );
}