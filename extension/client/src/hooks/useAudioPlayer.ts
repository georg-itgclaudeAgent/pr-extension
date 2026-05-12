import { useState, useCallback, useRef, useEffect } from "react";

const WAVEFORM_BARS = 200;

function extractWaveformData(audioBuffer: AudioBuffer, bars: number): number[] {
  const rawData = audioBuffer.getChannelData(0);
  const samplesPerBar = Math.floor(rawData.length / bars);
  const waveform: number[] = [];

  for (let i = 0; i < bars; i++) {
    let sum = 0;
    const start = i * samplesPerBar;
    for (let j = start; j < start + samplesPerBar && j < rawData.length; j++) {
      sum += Math.abs(rawData[j]);
    }
    waveform.push(sum / samplesPerBar);
  }

  // Normalize to 0-1 range
  const max = Math.max(...waveform);
  if (max > 0) {
    for (let i = 0; i < waveform.length; i++) {
      waveform[i] = waveform[i] / max;
    }
  }

  return waveform;
}

export function useAudioPlayer() {
  const [audioSize, setAudioSize] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const animFrameRef = useRef<number>(0);

  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!audioRef.current.paused) {
        animFrameRef.current = requestAnimationFrame(updateTime);
      }
    }
  }, []);

  const loadAudio = useCallback(async (audioData: ArrayBuffer) => {
    // Clean up previous
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);

    // Decode for waveform data
    const audioContext = new AudioContext();
    const decoded = await audioContext.decodeAudioData(audioData.slice(0));
    const waveform = extractWaveformData(decoded, WAVEFORM_BARS);
    await audioContext.close();

    // Create HTMLAudioElement for playback
    const blob = new Blob([audioData], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    blobUrlRef.current = url;

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setCurrentTime(0);
      cancelAnimationFrame(animFrameRef.current);
    });

    setWaveformData(waveform);
    setAudioSize(audioData.byteLength);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [updateTime]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      animFrameRef.current = requestAnimationFrame(updateTime);
    }
  }, [updateTime]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      cancelAnimationFrame(animFrameRef.current);
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setWaveformData([]);
    setAudioSize(0);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    audioSize,
    waveformData,
    duration,
    currentTime,
    isPlaying,
    loadAudio,
    play,
    pause,
    seek,
    cleanup,
  };
}
