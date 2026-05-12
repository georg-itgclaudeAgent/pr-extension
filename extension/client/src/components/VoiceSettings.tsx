import React from "react";
import { VoiceSettings as VoiceSettingsType } from "../types";

interface VoiceSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  settings: VoiceSettingsType;
  onChange: (settings: VoiceSettingsType) => void;
}

const Slider: React.FC<{
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}> = ({ label, leftLabel, rightLabel, value, min, max, step, onChange }) => (
  <div className="slider-group">
    <label className="slider-label">{label}</label>
    <div className="slider-row">
      <span className="slider-bound">{leftLabel}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat((e.target as HTMLInputElement).value))}
      />
      <span className="slider-bound">{rightLabel}</span>
    </div>
  </div>
);

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  enabled,
  onToggle,
  settings,
  onChange,
}) => {
  const update = (key: keyof VoiceSettingsType, value: number | boolean) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="voice-settings">
      <div className="toggle-row">
        <label>Override settings</label>
        <button
          className={`toggle-btn ${enabled ? "active" : ""}`}
          onClick={() => onToggle(!enabled)}
        >
          <span className="toggle-thumb" />
        </button>
      </div>

      {enabled && (
        <div className="settings-sliders">
          <Slider
            label="Speed"
            leftLabel="Slower"
            rightLabel="Faster"
            value={settings.speed}
            min={0.7}
            max={1.2}
            step={0.05}
            onChange={(v) => update("speed", v)}
          />
          <Slider
            label="Stability"
            leftLabel="More variable"
            rightLabel="More stable"
            value={settings.stability}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => update("stability", v)}
          />
          <Slider
            label="Similarity"
            leftLabel="Low"
            rightLabel="High"
            value={settings.similarity_boost}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => update("similarity_boost", v)}
          />
          <Slider
            label="Style Exaggeration"
            leftLabel="None"
            rightLabel="Exaggerated"
            value={settings.style}
            min={0}
            max={1}
            step={0.05}
            onChange={(v) => update("style", v)}
          />
          <div className="toggle-row">
            <label>Speaker boost</label>
            <button
              className={`toggle-btn ${settings.use_speaker_boost ? "active" : ""}`}
              onClick={() =>
                update("use_speaker_boost", !settings.use_speaker_boost)
              }
            >
              <span className="toggle-thumb" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
