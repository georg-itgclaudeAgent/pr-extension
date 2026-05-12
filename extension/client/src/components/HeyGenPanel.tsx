import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  HeyGenSettings,
  HeyGenAvatar,
  TransferredAudio,
} from "../types";
import {
  listDigitalTwins,
  getAvatarLooks,
  uploadAudioAsset,
  createVideo,
  getVideoStatus,
  getCredits,
  VideoStatus,
} from "../api/heygen";
import { saveVideoFile, importAndInsertAtPlayhead } from "../utils/premiere";
import { AvatarSelector } from "./AvatarSelector";
import { MotionEngine } from "./MotionEngine";
import { LayoutToggle } from "./LayoutToggle";
import { VideoPreview } from "./VideoPreview";

interface HeyGenPanelProps {
  settings: HeyGenSettings;
  onUpdate: (updates: Partial<HeyGenSettings>) => void;
  onOpenSettings: () => void;
  transferredAudio: TransferredAudio | null;
  onClearTransferredAudio: () => void;
  onBadgeChange: (show: boolean) => void;
  isActiveTab: boolean;
}

export const HeyGenPanel: React.FC<HeyGenPanelProps> = ({
  settings,
  onUpdate,
  onOpenSettings,
  transferredAudio,
  onClearTransferredAudio,
  onBadgeChange,
  isActiveTab,
}) => {
  const [avatars, setAvatars] = useState<HeyGenAvatar[]>([]);
  const [avatarsLoading, setAvatarsLoading] = useState(true);
  const [remainingCredits, setRemainingCredits] = useState<number | null | "error">(null);
  const [uploadedFile, setUploadedFile] = useState<{ data: ArrayBuffer; name: string; size: number } | null>(null);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<{
    url: string;
    size: number;
    creditsUsed: number;
  } | null>(null);
  const [addingToTimeline, setAddingToTimeline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<number>(0);
  const creditsBeforeRef = useRef<number>(0);

  const fetchCredits = useCallback(async () => {
    const result = await getCredits(settings.apiKey);
    if (result) {
      setRemainingCredits(result.remaining);
    } else {
      setRemainingCredits("error");
    }
  }, [settings.apiKey]);

  useEffect(() => {
    if (!settings.apiKey) return;
    const fetchAvatars = async () => {
      setAvatarsLoading(true);
      try {
        const list = await listDigitalTwins(settings.apiKey);
        setAvatars(list);
        if (list.length > 0 && !settings.lastAvatarGroupId) {
          onUpdate({ lastAvatarGroupId: list[0].group_id });
        }
      } catch (err: any) {
        setError(`Failed to load avatars: ${err.message}`);
      }
      setAvatarsLoading(false);
    };
    fetchAvatars();
    fetchCredits();
  }, [settings.apiKey, fetchCredits]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const getAudioSource = useCallback((): { data: ArrayBuffer; name: string; size: number } | null => {
    if (uploadedFile) return uploadedFile;
    if (transferredAudio) return { data: transferredAudio.data, name: transferredAudio.filename, size: transferredAudio.size };
    return null;
  }, [uploadedFile, transferredAudio]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      setUploadedFile({ data: buffer, name: file.name, size: buffer.byteLength });
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleGenerate = useCallback(async () => {
    const audio = getAudioSource();
    if (!audio || !settings.lastAvatarGroupId) return;

    setGenerating(true);
    setError(null);
    setVideoResult(null);
    setGenerationStatus("Uploading audio...");

    creditsBeforeRef.current = typeof remainingCredits === "number" ? remainingCredits : 0;

    try {
      // Step 1: Upload audio
      const assetId = await uploadAudioAsset(settings.apiKey, audio.data, audio.name);

      // Step 2: Get first look for selected avatar
      const looks = await getAvatarLooks(settings.apiKey, settings.lastAvatarGroupId);
      const lookId = settings.lastAvatarLookId && looks.find((l) => l.id === settings.lastAvatarLookId)
        ? settings.lastAvatarLookId
        : looks[0]?.id;

      if (!lookId) {
        throw new Error("No avatar looks found. Please select a different avatar.");
      }

      // Step 3: Create video
      setGenerationStatus("Creating video scene...");
      const videoId = await createVideo(settings.apiKey, {
        avatarLookId: lookId,
        audioAssetId: assetId,
        motionEngine: settings.motionEngine,
        motionStyle: settings.motionStyle,
        layout: settings.layout,
      });

      // Step 4: Poll for completion
      setGenerationStatus("Processing video...");
      onBadgeChange(true);

      pollingRef.current = window.setInterval(async () => {
        try {
          const status: VideoStatus = await getVideoStatus(settings.apiKey, videoId);
          if (status.status === "completed" && status.video_url) {
            clearInterval(pollingRef.current);
            pollingRef.current = 0;

            // Fetch video to get size
            const videoResp = await fetch(status.video_url);
            const videoBlob = await videoResp.blob();

            // Refresh credits and calculate used
            const creditsResult = await getCredits(settings.apiKey);
            const creditsAfter = creditsResult ? creditsResult.remaining : 0;
            setRemainingCredits(creditsResult ? creditsResult.remaining : "error");

            setVideoResult({
              url: status.video_url,
              size: videoBlob.size,
              creditsUsed: Math.max(0, creditsBeforeRef.current - creditsAfter),
            });
            setGenerating(false);
            setGenerationStatus(null);
            onBadgeChange(false);
          } else if (status.status === "failed") {
            clearInterval(pollingRef.current);
            pollingRef.current = 0;
            setError(status.failure_message || "Video generation failed.");
            setGenerating(false);
            setGenerationStatus(null);
            onBadgeChange(false);
          }
        } catch (err: any) {
          clearInterval(pollingRef.current);
          pollingRef.current = 0;
          setError(err.message || "Polling failed.");
          setGenerating(false);
          setGenerationStatus(null);
          onBadgeChange(false);
        }
      }, 10000);
    } catch (err: any) {
      setError(err.message || "Failed to generate video.");
      setGenerating(false);
      setGenerationStatus(null);
    }
  }, [settings, getAudioSource, remainingCredits, fetchCredits, onBadgeChange]);

  const handleAddToTimeline = useCallback(async () => {
    if (!videoResult) return;
    if (!settings.outputDirectory) {
      setError("No output directory set. Please configure in HeyGen Settings.");
      return;
    }

    setAddingToTimeline(true);
    setError(null);

    try {
      const videoResp = await fetch(videoResult.url);
      const videoBuffer = await videoResp.arrayBuffer();
      const filePath = await saveVideoFile(videoBuffer, settings.outputDirectory);
      await importAndInsertAtPlayhead(filePath);
      setVideoResult(null);
    } catch (err: any) {
      setError(err.message || "Failed to add video to timeline.");
    }
    setAddingToTimeline(false);
  }, [videoResult, settings.outputDirectory]);

  const handleRegenerate = useCallback(() => {
    setVideoResult(null);
    handleGenerate();
  }, [handleGenerate]);

  const audioSource = getAudioSource();

  if (!settings.apiKey) {
    return (
      <div className="heygen-panel">
        <div className="tab-placeholder">
          <p>Please configure your HeyGen API key in settings.</p>
        </div>
        <button className="btn-primary" onClick={onOpenSettings} style={{ margin: "0 12px" }}>
          Open HeyGen Settings
        </button>
      </div>
    );
  }

  return (
    <div className="heygen-panel">
      <div className="panel-header">
        <span className="credits-label">
          {remainingCredits === null
            ? "Loading credits..."
            : remainingCredits === "error"
            ? "Remaining Credits = --"
            : `Remaining Credits = ${typeof remainingCredits === "number" ? remainingCredits.toFixed(2) : remainingCredits}`}
        </span>
        <button className="btn-icon" onClick={onOpenSettings} title="HeyGen Settings">
          &#9881;
        </button>
      </div>

      {/* Audio source */}
      <div className="heygen-audio-section">
        <label>Audio</label>
        <label className="upload-btn btn-secondary" style={{ textAlign: "center", display: "block", cursor: "pointer" }}>
          Upload Audio File
          <input
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </label>

        {transferredAudio && !uploadedFile && (
          <div className="audio-ready" style={{ marginTop: "8px" }}>
            <span className="audio-ready-icon">&#10003;</span>
            <span>Audio from ElevenLabs ({(transferredAudio.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        {uploadedFile && (
          <div className="audio-ready" style={{ marginTop: "8px" }}>
            <span className="audio-ready-icon">&#10003;</span>
            <span>{uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      <AvatarSelector
        avatars={avatars}
        selectedGroupId={settings.lastAvatarGroupId}
        onSelect={(id) => onUpdate({ lastAvatarGroupId: id })}
        loading={avatarsLoading}
      />

      <MotionEngine
        engine={settings.motionEngine}
        style={settings.motionStyle}
        onEngineChange={(engine) => onUpdate({ motionEngine: engine })}
        onStyleChange={(style) => onUpdate({ motionStyle: style })}
      />

      <LayoutToggle
        layout={settings.layout}
        onChange={(layout) => onUpdate({ layout })}
      />

      <button
        className="btn-primary btn-generate"
        onClick={handleGenerate}
        disabled={generating || !audioSource || !settings.lastAvatarGroupId}
      >
        {generating ? (generationStatus || "Generating...") : "Generate Scene"}
      </button>

      {videoResult && (
        <VideoPreview
          videoUrl={videoResult.url}
          videoSize={videoResult.size}
          creditsUsed={videoResult.creditsUsed}
          onAddToTimeline={handleAddToTimeline}
          onRegenerate={handleRegenerate}
          addingToTimeline={addingToTimeline}
        />
      )}

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
};
