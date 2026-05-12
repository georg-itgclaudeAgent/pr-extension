import React, { useState } from "react";
import { getSelectedCaptionText } from "../utils/premiere";

interface TextInputProps {
  text: string;
  onChange: (text: string) => void;
}

export const TextInput: React.FC<TextInputProps> = ({ text, onChange }) => {
  const [grabbing, setGrabbing] = useState(false);
  const [grabError, setGrabError] = useState<string | null>(null);

  const handleFromTimeline = async () => {
    setGrabbing(true);
    setGrabError(null);
    try {
      const captionText = await getSelectedCaptionText();
      if (captionText) {
        onChange(captionText);
      } else {
        setGrabError("No text/caption selected in the timeline.");
      }
    } catch (err: any) {
      setGrabError(err.message || "Failed to read from timeline.");
    }
    setGrabbing(false);
  };

  return (
    <div className="text-input">
      <label>Text</label>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your voiceover text here..."
        rows={5}
      />
      <div className="text-input-footer">
        <button
          className="btn-small"
          onClick={handleFromTimeline}
          disabled={grabbing}
        >
          {grabbing ? "Reading..." : "From Timeline"}
        </button>
        <span className="char-count">{text.length} characters</span>
      </div>
      {grabError && <div className="error-text">{grabError}</div>}
    </div>
  );
};
