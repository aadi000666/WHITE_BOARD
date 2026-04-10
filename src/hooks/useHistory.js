import { useRef, useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants/tools';

export function useHistory(canvasRef) {
  const stackRef   = useRef([]);   // array of ImageData
  const indexRef   = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncButtons = useCallback(() => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < stackRef.current.length - 1);
  }, []);

  /** Call after every stroke / shape is committed */
  const save = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    // truncate redo branch
    stackRef.current = stackRef.current.slice(0, indexRef.current + 1);
    stackRef.current.push(data);
    if (stackRef.current.length > 80) stackRef.current.shift();
    else indexRef.current++;
    syncButtons();
  }, [canvasRef, syncButtons]);

  const undo = useCallback(() => {
    if (indexRef.current <= 0) return;
    indexRef.current--;
    canvasRef.current
      .getContext('2d')
      .putImageData(stackRef.current[indexRef.current], 0, 0);
    syncButtons();
  }, [canvasRef, syncButtons]);

  const redo = useCallback(() => {
    if (indexRef.current >= stackRef.current.length - 1) return;
    indexRef.current++;
    canvasRef.current
      .getContext('2d')
      .putImageData(stackRef.current[indexRef.current], 0, 0);
    syncButtons();
  }, [canvasRef, syncButtons]);

  /** Seed the history with the initial blank canvas */
  const init = useCallback(() => {
    stackRef.current = [];
    indexRef.current = -1;
    save();
  }, [save]);

  return { save, undo, redo, init, canUndo, canRedo };
}