import React, { useRef, useEffect, useCallback } from "react";

interface WaveformPlayerProps {
  audioSize: number;
  creditsUsed: number;
  waveformData: number[];
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onAddToTimeline: () => void;
  onRegenerate: () => void;
  addingToTimeline: boolean;
  onTransferToHeyGen?: () => void;
}

const CANVAS_HEIGHT = 48;
const BAR_WIDTH = 2;
const BAR_GAP = 1;
const COLOR_PLAYED = "#6c5ce7";
const COLOR_UNPLAYED = "#444";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  audioSize,
  creditsUsed,
  waveformData,
  duration,
  currentTime,
  isPlaying,
  onPlay,
  onPause,
  onSeek,
  onAddToTimeline,
  onRegenerate,
  addingToTimeline,
  onTransferToHeyGen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = CANVAS_HEIGHT;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, displayWidth, displayHeight);

    const totalBarWidth = BAR_WIDTH + BAR_GAP;
    const barsToRender = Math.min(
      waveformData.length,
      Math.floor(displayWidth / totalBarWidth)
    );
    const progress = duration > 0 ? currentTime / duration : 0;
    const playedBars = Math.floor(barsToRender * progress);

    for (let i = 0; i < barsToRender; i++) {
      const amplitude = waveformData[i] || 0;
      const barHeight = Math.max(2, amplitude * (displayHeight - 4));
      const x = i * totalBarWidth;
      const y = (displayHeight - barHeight) / 2;

      ctx.fillStyle = i < playedBars ? COLOR_PLAYED : COLOR_UNPLAYED;
      ctx.beginPath();
      ctx.roundRect(x, y, BAR_WIDTH, barHeight, 1);
      ctx.fill();
    }
  }, [waveformData, currentTime, duration]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || duration === 0) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = clickX / rect.width;
      onSeek(ratio * duration);
    },
    [duration, onSeek]
  );

  const handleScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSeek(parseFloat(e.target.value));
    },
    [onSeek]
  );

  return (
    <div className="audio-preview">
      <div className="audio-ready">
        <span className="audio-ready-icon">&#10003;</span>
        <span>Audio generated ({formatSize(audioSize)}) | Credits used: {creditsUsed.toLocaleString()}</span>
      </div>

      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
      />

      <div className="waveform-controls">
        <button
          className="btn-play"
          onClick={isPlaying ? onPause : onPlay}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "\u275A\u275A" : "\u25B6"}
        </button>

        <input
          type="range"
          className="waveform-scrub"
          min={0}
          max={duration || 0}
          step={0.01}
          value={currentTime}
          onChange={handleScrub}
        />

        <span className="waveform-time">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="audio-actions">
        <button
          className="btn-primary"
          onClick={onAddToTimeline}
          disabled={addingToTimeline}
        >
          {addingToTimeline ? "Adding..." : "Add to Timeline"}
        </button>
        <button className="btn-secondary" onClick={onRegenerate}>
          Re-generate
        </button>
      </div>
      {onTransferToHeyGen && (
        <button
          className="btn-secondary"
          onClick={onTransferToHeyGen}
          style={{ width: "100%" }}
        >
          Import Audio to HeyGen
        </button>
      )}
    </div>
  );
};
