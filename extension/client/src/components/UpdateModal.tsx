import React from "react";
import { ReleaseInfo } from "../api/githubReleases";

interface UpdateModalProps {
  installed: string;
  latest: ReleaseInfo;
  onClose: () => void;
  onDismissForever: () => void;
}

/** Extract up to the first 3 bullet/line items from a release-notes markdown string. */
function summarizeNotes(notes: string): string[] {
  if (!notes) return [];
  const lines = notes
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("SHA256:") && !l.startsWith("##"));
  // Strip markdown bullet markers and `* ` prefixes
  return lines
    .map((l) => l.replace(/^[-*]\s+/, ""))
    .filter((l) => l.length > 0)
    .slice(0, 3);
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  installed,
  latest,
  onClose,
  onDismissForever,
}) => {
  const bullets = summarizeNotes(latest.notes);

  return (
    <div className="update-modal-backdrop">
      <div className="update-modal">
        <div className="update-modal-icon">&#8595;</div>
        <div className="update-modal-title">New update available</div>
        <div className="update-modal-subtitle">
          Version <strong>{latest.version}</strong> is available.<br />
          You're on <strong>{installed}</strong>.
        </div>
        {bullets.length > 0 && (
          <div className="update-modal-notes">
            <div className="update-modal-notes-title">What's new</div>
            <ul>
              {bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        )}
        <div className="update-modal-hint">
          Open the Extension Manager to install this update.
        </div>
        <button className="update-modal-close" onClick={onClose}>Close</button>
        <button className="update-modal-dismiss-forever" onClick={onDismissForever}>
          Don't remind me about {latest.version}
        </button>
      </div>
    </div>
  );
};
