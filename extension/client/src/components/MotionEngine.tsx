import React from "react";
import { MotionEngine as MotionEngineType, MotionStyle } from "../types";

interface MotionEngineProps {
  engine: MotionEngineType;
  style: MotionStyle;
  onEngineChange: (engine: MotionEngineType) => void;
  onStyleChange: (style: MotionStyle) => void;
}

const ENGINE_OPTIONS: { value: MotionEngineType; label: string; desc: string }[] = [
  { value: "v5", label: "Avatar V", desc: "Premium \u2014 Moves like you" },
  { value: "v4", label: "Avatar IV", desc: "Premium \u2014 Motion adapts to script" },
  { value: "v3", label: "Avatar III", desc: "Unlimited usage" },
];

export const MotionEngine: React.FC<MotionEngineProps> = ({
  engine,
  style,
  onEngineChange,
  onStyleChange,
}) => {
  return (
    <div className="motion-engine">
      <label>Motion Engine</label>
      <select
        value={engine}
        onChange={(e) => onEngineChange(e.target.value as MotionEngineType)}
      >
        {ENGINE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} \u2014 {opt.desc}
          </option>
        ))}
      </select>

      <div className="style-toggle">
        <button
          className={`style-btn ${style === "original" ? "active" : ""}`}
          onClick={() => onStyleChange("original")}
        >
          Original
        </button>
        <button
          className={`style-btn ${style === "circle" ? "active" : ""}`}
          onClick={() => onStyleChange("circle")}
        >
          Circle
        </button>
      </div>
    </div>
  );
};
