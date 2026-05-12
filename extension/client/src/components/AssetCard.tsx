import React from "react";
import { Asset } from "../types";
import { fileTypeLabel } from "../utils/assetUtils";
import { useVideoThumbnail } from "../hooks/useVideoThumbnail";

interface AssetCardProps {
  asset: Asset;
  busy: boolean;
  onClick: () => void;
  onDragFallback: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function fileUrl(absPath: string): string {
  return "file:///" + encodeURI(absPath.replace(/\\/g, "/"));
}

function formatDuration(sec: number): string {
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, busy, onClick, onDragFallback, onContextMenu }) => {
  const isImage = asset.mimeType.startsWith("image/");
  const isVideo = asset.mimeType.startsWith("video/");
  const isAudio = asset.mimeType.startsWith("audio/");

  const { thumb: videoThumb, durationSec } = useVideoThumbnail(asset.id, isVideo);
  const durationLabel = durationSec !== null ? formatDuration(durationSec) : null;

  // Drag a card → drop on Premiere timeline / project bin.
  // Multiple dataTransfer formats maximize compatibility with Premiere's
  // drop handlers across versions. If the drop isn't accepted anywhere,
  // dragend falls back to insert-at-playhead (same as clicking).
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (busy) {
      e.preventDefault();
      return;
    }
    const uri = fileUrl(asset.id);
    e.dataTransfer.setData("text/uri-list", uri);
    e.dataTransfer.setData("text/plain", asset.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // dropEffect === "none" → no Premiere panel accepted the drop. Fall back
    // to programmatic insert at playhead so the drag still produces a result.
    if (e.dataTransfer.dropEffect === "none" && !busy) {
      onDragFallback();
    }
  };

  return (
    <div
      className={`asset-card ${busy ? "busy" : ""}`}
      draggable={!busy}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={busy ? undefined : onClick}
      onContextMenu={onContextMenu}
      title={`${asset.name}\n\nDrag to bin / timeline · Click to insert at playhead · Right-click for more`}
    >
      <div className="asset-thumb">
        {isImage && <img src={fileUrl(asset.id)} alt={asset.name} draggable={false} />}
        {isVideo && videoThumb && <img src={videoThumb} alt={asset.name} draggable={false} />}
        {isVideo && !videoThumb && <span className="asset-thumb-placeholder">&#9654;</span>}
        {isAudio && <span className="asset-thumb-placeholder asset-thumb-audio">&#9835;</span>}
        {!isImage && !isVideo && !isAudio && (
          <span className="asset-thumb-placeholder">{fileTypeLabel(asset).slice(0, 4)}</span>
        )}
        {busy && <div className="asset-busy-overlay">Loading...</div>}
      </div>
      <div className="asset-meta">
        <span className="asset-name">{asset.name}</span>
        {durationLabel && <span className="asset-duration-inline">{durationLabel}</span>}
      </div>
    </div>
  );
};
