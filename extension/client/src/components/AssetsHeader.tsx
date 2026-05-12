import React from "react";

interface AssetsHeaderProps {
  totalCount: number;
  syncing: boolean;
  error: string | null;
  onOpenSettings: () => void;
}

export const AssetsHeader: React.FC<AssetsHeaderProps> = ({
  totalCount,
  syncing,
  error,
  onOpenSettings,
}) => {
  let status: string;
  let dotColor: string;
  if (error) { status = "Error"; dotColor = "#e06464"; }
  else if (syncing) { status = "Syncing..."; dotColor = "#e6c060"; }
  else { status = "Synced"; dotColor = "#6cd06c"; }

  return (
    <div className="panel-header">
      <span className="credits-label">
        {totalCount} asset{totalCount === 1 ? "" : "s"}
        <span style={{ color: dotColor, marginLeft: 8 }}>&#9679;</span>
        <span style={{ marginLeft: 4 }}>{status}</span>
      </span>
      <button className="btn-icon" onClick={onOpenSettings} title="Assets Settings">
        &#9881;
      </button>
    </div>
  );
};
