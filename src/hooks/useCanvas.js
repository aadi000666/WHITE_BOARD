import { useRef, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants/tools';

const LASER_FADE_MS = 800;

export function useCanvas({
  canvasRef, overlayRef, laserCanvasRef,
  activeTool, color, strokeWidth, opacity, filled,
  onSave,
}) {
  const isDrawing  = useRef(false);
  const startPos   = useRef({ x: 0, y: 0 });
  const laserPts   = useRef([]);   // [{x,y,t}]
  const laserRAF   = useRef(null);

  /* ── coordinate transform ──────────────────────────────────── */
  const getPos = useCallback((e, canvas) => {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH  / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - rect.left) * scaleX,
      y: (cy - rect.top)  * scaleY,
    };
  }, []);

  /* ── laser pointer loop ────────────────────────────────────── */
  const drawLaser = useCallback(() => {
    const lc = laserCanvasRef.current;
    if (!lc) return;
    const lctx = lc.getContext('2d');
    lctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const now = performance.now();
    laserPts.current = laserPts.current.filter(p => now - p.t < LASER_FADE_MS);
    if (laserPts.current.length < 2) {
      laserRAF.current = requestAnimationFrame(drawLaser);
      return;
    }
    for (let i = 1; i < laserPts.current.length; i++) {
      const a = laserPts.current[i - 1];
      const b = laserPts.current[i];
      const age = now - a.t;
      const alpha = Math.max(0, 1 - age / LASER_FADE_MS);
      lctx.beginPath();
      lctx.moveTo(a.x, a.y);
      lctx.lineTo(b.x, b.y);
      lctx.strokeStyle = `rgba(255,30,30,${alpha})`;
      lctx.lineWidth   = strokeWidth + 2;
      lctx.lineCap     = 'round';
      lctx.shadowColor = 'rgba(255,60,60,0.7)';
      lctx.shadowBlur  = 8;
      lctx.stroke();
      lctx.shadowBlur  = 0;
    }
    // dot at last point
    const last = laserPts.current[laserPts.current.length - 1];
    lctx.beginPath();
    lctx.arc(last.x, last.y, strokeWidth + 3, 0, Math.PI * 2);
    lctx.fillStyle = 'rgba(255,30,30,0.9)';
    lctx.fill();
    laserRAF.current = requestAnimationFrame(drawLaser);
  }, [laserCanvasRef, strokeWidth]);

  /* ── setup canvas ctx props ────────────────────────────────── */
  const applyCtxProps = useCallback((ctx, opts = {}) => {
    ctx.globalAlpha           = opts.alpha ?? opacity;
    ctx.globalCompositeOperation = opts.composite ?? 'source-over';
    ctx.strokeStyle           = opts.stroke ?? color;
    ctx.fillStyle             = opts.fill   ?? color;
    ctx.lineWidth             = opts.width  ?? strokeWidth;
    ctx.lineCap               = 'round';
    ctx.lineJoin              = 'round';
  }, [color, strokeWidth, opacity]);

  /* ── draw shapes on overlay ────────────────────────────────── */
  const drawShapePreview = useCallback((oc, sx, sy, ex, ey) => {
    oc.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    applyCtxProps(oc);

    switch (activeTool) {
      case 'line': {
        oc.beginPath(); oc.moveTo(sx, sy); oc.lineTo(ex, ey); oc.stroke();
        break;
      }
      case 'arrow': {
        const angle = Math.atan2(ey - sy, ex - sx);
        const hl    = Math.max(16, strokeWidth * 4);
        oc.beginPath(); oc.moveTo(sx, sy); oc.lineTo(ex, ey); oc.stroke();
        [[angle - Math.PI / 6], [angle + Math.PI / 6]].forEach(([a]) => {
          oc.beginPath();
          oc.moveTo(ex, ey);
          oc.lineTo(ex - hl * Math.cos(a), ey - hl * Math.sin(a));
          oc.stroke();
        });
        break;
      }
      case 'rect': {
        oc.beginPath(); oc.rect(sx, sy, ex - sx, ey - sy);
        filled ? oc.fill() : oc.stroke();
        break;
      }
      case 'circle': {
        const rx = Math.abs(ex - sx) / 2;
        const ry = Math.abs(ey - sy) / 2;
        oc.beginPath();
        oc.ellipse((sx + ex) / 2, (sy + ey) / 2, rx, ry, 0, 0, Math.PI * 2);
        filled ? oc.fill() : oc.stroke();
        break;
      }
      case 'diamond': {
        const mx = (sx + ex) / 2, my = (sy + ey) / 2;
        oc.beginPath();
        oc.moveTo(mx, sy); oc.lineTo(ex, my);
        oc.lineTo(mx, ey); oc.lineTo(sx, my);
        oc.closePath();
        filled ? oc.fill() : oc.stroke();
        break;
      }
      default: break;
    }
  }, [activeTool, filled, strokeWidth, applyCtxProps]);

  /* ── pointer down ──────────────────────────────────────────── */
  const onDown = useCallback((e, onTextRequest) => {
    e.preventDefault();
    const overlay = overlayRef.current;
    if (!overlay) return;
    const pos = getPos(e, overlay);

    if (activeTool === 'text') {
      onTextRequest?.(e.clientX, e.clientY, pos.x, pos.y);
      return;
    }
    if (activeTool === 'sticky') {
      onTextRequest?.(e.clientX, e.clientY, pos.x, pos.y, true);
      return;
    }
    if (activeTool === 'pan') return;

    isDrawing.current = true;
    startPos.current  = pos;

    if (activeTool === 'laser') {
      laserPts.current = [];
      cancelAnimationFrame(laserRAF.current);
      laserRAF.current = requestAnimationFrame(drawLaser);
    }

    if (['pen', 'marker', 'eraser'].includes(activeTool)) {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  }, [activeTool, canvasRef, overlayRef, getPos, drawLaser]);

  /* ── pointer move ──────────────────────────────────────────── */
  const onMove = useCallback((e) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const overlay = overlayRef.current;
    if (!overlay) return;
    const pos = getPos(e, overlay);

    if (activeTool === 'laser') {
      laserPts.current.push({ x: pos.x, y: pos.y, t: performance.now() });
      return;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (activeTool === 'pen') {
      applyCtxProps(ctx);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (activeTool === 'marker') {
      applyCtxProps(ctx, { alpha: 0.35, width: strokeWidth * 5 });
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (activeTool === 'eraser') {
      applyCtxProps(ctx, { stroke: '#ffffff', width: strokeWidth * 7, alpha: 1 });
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else {
      const oc = overlay.getContext('2d');
      drawShapePreview(oc, startPos.current.x, startPos.current.y, pos.x, pos.y);
    }
  }, [activeTool, canvasRef, overlayRef, strokeWidth, getPos, applyCtxProps, drawShapePreview]);

  /* ── pointer up ────────────────────────────────────────────── */
  const onUp = useCallback((e) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (activeTool === 'laser') return;

    const overlay = overlayRef.current;
    const canvas  = canvasRef.current;
    if (!canvas || !overlay) return;

    const shapeTools = ['line', 'arrow', 'rect', 'circle', 'diamond'];
    if (shapeTools.includes(activeTool)) {
      const ctx = canvas.getContext('2d');
      const oc  = overlay.getContext('2d');
      ctx.drawImage(overlay, 0, 0);
      oc.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    if (!['text', 'sticky', 'select', 'pan'].includes(activeTool)) {
      onSave();
    }
  }, [activeTool, canvasRef, overlayRef, onSave]);

  /* ── commit text onto canvas ───────────────────────────────── */
  const commitText = useCallback((value, cx, cy, fontSize) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !value.trim()) return;
    ctx.globalAlpha  = opacity;
    ctx.fillStyle    = color;
    ctx.font         = `${fontSize}px 'Outfit', sans-serif`;
    ctx.fillText(value, cx, cy);
    ctx.globalAlpha  = 1;
    onSave();
  }, [canvasRef, color, opacity, onSave]);

  return { onDown, onMove, onUp, commitText };
}