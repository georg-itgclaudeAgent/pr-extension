import React, { useRef, useState, useCallback, useEffect } from "react";

interface VideoPreviewProps {
  videoUrl: string;
  videoSize: number;
  creditsUsed: number;
  onAddToTimeline: () => void;
  onRegenerate: () => void;
  addingToTimeline: boolean;
}

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

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  videoUrl,
  videoSize,
  creditsUsed,
  onAddToTimeline,
  onRegenerate,
  addingToTimeline,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const animFrameRef = useRef<number>(0);

  const updateTime = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!videoRef.current.paused) {
        animFrameRef.current = requestAnimationFrame(updateTime);
      }
    }
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handlePlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [updateTime]);

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
    }
  }, []);

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return (
    <div className="video-preview-section">
      <div className="audio-ready">
        <span className="audio-ready-icon">&#10003;</span>
        <span>Video generated ({formatSize(videoSize)}) | Credits used: {creditsUsed.toFixed(2)}</span>
      </div>

      <video
        ref={videoRef}
        src={videoUrl}
        className="video-player"
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onEnded={() => {
          setIsPlaying(false);
          cancelAnimationFrame(animFrameRef.current);
        }}
      />

      <div className="waveform-controls">
        <button
          className="btn-play"
          onClick={isPlaying ? handlePause : handlePlay}
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
    </div>
  );
};
