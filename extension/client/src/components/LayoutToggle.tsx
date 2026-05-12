import React from "react";
import { VideoLayout } from "../types";

interface LayoutToggleProps {
  layout: VideoLayout;
  onChange: (layout: VideoLayout) => void;
}

export const LayoutToggle: React.FC<LayoutToggleProps> = ({
  layout,
  onChange,
}) => {
  return (
    <div className="layout-toggle">
      <label>Layout</label>
      <div className="style-toggle">
        <button
          className={`style-btn ${layout === "landscape" ? "active" : ""}`}
          onClick={() => onChange("landscape")}
        >
          Horizontal
        </button>
        <button
          className={`style-btn ${layout === "portrait" ? "active" : ""}`}
          onClick={() => onChange("portrait")}
        >
          Vertical
        </button>
      </div>
    </div>
  );
};
