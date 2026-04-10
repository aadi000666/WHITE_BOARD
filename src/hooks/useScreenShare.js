import { useState, useRef, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants/tools';

export function useScreenShare(canvasRef) {
  const [isSharing,    setIsSharing]    = useState(false);
  const [isRecording,  setIsRecording]  = useState(false);
  const [shareError,   setShareError]   = useState(null);
  const [recordedURL,  setRecordedURL]  = useState(null);

  const streamRef    = useRef(null);
  const videoRef     = useRef(null);   // <video> element for PiP display
  const recorderRef  = useRef(null);
  const chunksRef    = useRef([]);

  /* ── Start screen capture ──────────────────────────────────── */
  const startShare = useCallback(async () => {
    setShareError(null);
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always', frameRate: 30 },
        audio: true,
      });
      streamRef.current = stream;

      // Wire to PiP video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Auto-stop when user clicks browser's "Stop sharing"
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopShare();
      });

      setIsSharing(true);
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setShareError('Screen sharing unavailable. Use Chrome/Edge on HTTPS.');
      }
    }
  }, []);

  /* ── Stop ──────────────────────────────────────────────────── */
  const stopShare = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsSharing(false);
    if (isRecording) stopRecording();
  }, [isRecording]);

  /* ── Start recording ───────────────────────────────────────── */
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordedURL(null);

    const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? { mimeType: 'video/webm;codecs=vp9' }
      : { mimeType: 'video/webm' };

    const recorder = new MediaRecorder(streamRef.current, options);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedURL(URL.createObjectURL(blob));
    };

    recorderRef.current = recorder;
    recorder.start(200);
    setIsRecording(true);
  }, []);

  /* ── Stop recording ────────────────────────────────────────── */
  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsRecording(false);
  }, []);

  /* ── Project current screen frame onto whiteboard canvas ──── */
  const projectToCanvas = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const ctx = canvas.getContext('2d');
    // Fit the video frame into the canvas maintaining aspect ratio
    const vr = video.videoWidth  / video.videoHeight;
    const cr = CANVAS_WIDTH / CANVAS_HEIGHT;
    let dx = 0, dy = 0, dw = CANVAS_WIDTH, dh = CANVAS_HEIGHT;
    if (vr > cr) { dh = CANVAS_WIDTH / vr; dy = (CANVAS_HEIGHT - dh) / 2; }
    else         { dw = CANVAS_HEIGHT * vr; dx = (CANVAS_WIDTH  - dw) / 2; }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.drawImage(video, dx, dy, dw, dh);
  }, [canvasRef]);

  /* ── Download recorded video ───────────────────────────────── */
  const downloadRecording = useCallback(() => {
    if (!recordedURL) return;
    const a = document.createElement('a');
    a.href     = recordedURL;
    a.download = `classboard-recording-${Date.now()}.webm`;
    a.click();
  }, [recordedURL]);

  return {
    isSharing, isRecording, shareError, recordedURL,
    videoRef, streamRef,
    startShare, stopShare,
    startRecording, stopRecording,
    projectToCanvas, downloadRecording,
  };
}