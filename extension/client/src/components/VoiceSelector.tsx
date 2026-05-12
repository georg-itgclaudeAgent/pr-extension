import React from "react";
import { Voice } from "../types";

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoiceId: string;
  onSelect: (voiceId: string) => void;
  loading: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  onSelect,
  loading,
}) => {
  if (loading) {
    return <div className="voice-selector">Loading voices...</div>;
  }

  if (voices.length === 0) {
    return (
      <div className="voice-selector">
        <p className="no-voices">No personal voices found in your ElevenLabs account.</p>
      </div>
    );
  }

  return (
    <div className="voice-selector">
      <label>Voice</label>
      <select
        value={selectedVoiceId}
        onChange={(e) => onSelect((e.target as HTMLSelectElement).value)}
      >
        {voices.map((voice) => (
          <option key={voice.voice_id} value={voice.voice_id}>
            {voice.name}
          </option>
        ))}
      </select>
    </div>
  );
};
