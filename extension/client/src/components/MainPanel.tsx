import React, { useState, useEffect, useCallback } from "react";
import { AppSettings, Voice, DEFAULT_VOICE_SETTINGS } from "../types";
import { listClonedVoices, generateSpeech, getRemainingCredits } from "../api/elevenlabs";
import { saveAudioFile, importAndInsertAtPlayhead } from "../utils/premiere";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { VoiceSelector } from "./VoiceSelector";
import { VoiceSettings } from "./VoiceSettings";
import { TextInput } from "./TextInput";
import { WaveformPlayer } from "./WaveformPlayer";

interface MainPanelProps {
  settings: AppSettings;
  onUpdate: (updates: Partial<AppSettings>) => void;
  onOpenSettings: () => void;
  text: string;
  onTextChange: (text: string) => void;
  onTransferToHeyGen?: (audio: { data: ArrayBuffer; filename: string; size: number }) => void;
}

export const MainPanel: React.FC<MainPanelProps> = ({
  settings,
  onUpdate,
  onOpenSettings,
  text,
  onTextChange: setText,
  onTransferToHeyGen,
}) => {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [remainingCredits, setRemainingCredits] = useState<{ remaining: number; limit: number } | null | "error">(null);
  const [generating, setGenerating] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [audioData, setAudioData] = useState<ArrayBuffer | null>(null);
  const [addingToTimeline, setAddingToTimeline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
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
  } = useAudioPlayer();

  const fetchCredits = useCallback(async () => {
    const result = await getRemainingCredits(settings.apiKey);
    setRemainingCredits(result || "error");
  }, [settings.apiKey]);

  useEffect(() => {
    const fetchVoices = async () => {
      setVoicesLoading(true);
      try {
        const v = await listClonedVoices(settings.apiKey);
        setVoices(v);
        if (v.length > 0 && !settings.lastVoiceId) {
          onUpdate({ lastVoiceId: v[0].voice_id });
        }
      } catch (err: any) {
        setError(`Failed to load voices: ${err.message}`);
      }
      setVoicesLoading(false);
    };
    fetchVoices();
    fetchCredits();
  }, [settings.apiKey, fetchCredits]);

  const handleGenerate = useCallback(async () => {
    if (!text.trim() || !settings.lastVoiceId) return;

    setGenerating(true);
    setError(null);
    cleanup();
    setAudioData(null);
    setCreditsUsed(0);

    try {
      const trimmedText = text.trim();
      const voiceSettings = settings.overrideEnabled
        ? settings.voiceSettings
        : DEFAULT_VOICE_SETTINGS;

      const audio = await generateSpeech(
        settings.apiKey,
        settings.lastVoiceId,
        trimmedText,
        voiceSettings
      );

      setAudioData(audio);
      setCreditsUsed(trimmedText.length);
      await loadAudio(audio);
      fetchCredits();
    } catch (err: any) {
      setError(err.message || "Failed to generate speech.");
    }
    setGenerating(false);
  }, [text, settings, cleanup, loadAudio]);

  const handleAddToTimeline = useCallback(async () => {
    if (!audioData) return;

    if (!settings.outputDirectoryToken) {
      setError("No output directory set. Please configure in Settings.");
      return;
    }

    setAddingToTimeline(true);
    setError(null);

    try {
      const filePath = await saveAudioFile(audioData, settings.outputDirectoryToken);
      await importAndInsertAtPlayhead(filePath);
      cleanup();
      setAudioData(null);
    } catch (err: any) {
      setError(err.message || "Failed to add audio to timeline.");
    }
    setAddingToTimeline(false);
  }, [audioData, settings.outputDirectoryToken, cleanup]);

  const handleRegenerate = useCallback(() => {
    cleanup();
    setAudioData(null);
    handleGenerate();
  }, [cleanup, handleGenerate]);

  const handleTransferToHeyGen = useCallback(() => {
    if (!audioData) return;
    const confirmed = confirm("Transfer audio to HeyGen tab?");
    if (confirmed && onTransferToHeyGen) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      onTransferToHeyGen({
        data: audioData,
        filename: `elevenlabs-${timestamp}.mp3`,
        size: audioData.byteLength,
      });
    }
  }, [audioData, onTransferToHeyGen]);

  return (
    <div className="main-panel">
      <div className="panel-header">
        <span className="credits-label">
          {remainingCredits === null
            ? "Loading credits..."
            : remainingCredits === "error"
            ? "Remaining Credits = --"
            : `Remaining Credits = ${remainingCredits.remaining.toLocaleString()}`}
        </span>
        <button className="btn-icon" onClick={onOpenSettings} title="Settings">
          &#9881;
        </button>
      </div>

      <VoiceSelector
        voices={voices}
        selectedVoiceId={settings.lastVoiceId}
        onSelect={(id) => onUpdate({ lastVoiceId: id })}
        loading={voicesLoading}
      />

      <VoiceSettings
        enabled={settings.overrideEnabled}
        onToggle={(enabled) => onUpdate({ overrideEnabled: enabled })}
        settings={settings.voiceSettings}
        onChange={(voiceSettings) => onUpdate({ voiceSettings })}
      />

      <TextInput text={text} onChange={setText} />

      <button
        className="btn-primary btn-generate"
        onClick={handleGenerate}
        disabled={generating || !text.trim() || !settings.lastVoiceId}
      >
        {generating ? "Generating..." : "Generate"}
      </button>

      {audioData && (
        <WaveformPlayer
          audioSize={audioSize}
          creditsUsed={creditsUsed}
          waveformData={waveformData}
          duration={duration}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onPlay={play}
          onPause={pause}
          onSeek={seek}
          onAddToTimeline={handleAddToTimeline}
          onRegenerate={handleRegenerate}
          addingToTimeline={addingToTimeline}
          onTransferToHeyGen={onTransferToHeyGen ? handleTransferToHeyGen : undefined}
        />
      )}

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
};
