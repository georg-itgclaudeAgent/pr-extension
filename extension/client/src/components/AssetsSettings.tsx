import React, { useState } from "react";
import { AssetsSettings } from "../types";
import { pickOutputDirectory } from "../utils/premiere";

interface AssetsSettingsViewProps {
  settings: AssetsSettings;
  onUpdate: (updates: Partial<AssetsSettings>) => void;
  onBack: () => void;
}

export const AssetsSettingsView: React.FC<AssetsSettingsViewProps> = ({
  settings,
  onUpdate,
  onBack,
}) => {
  const [folderPath, setFolderPath] = useState(settings.folderPath);

  const handleBrowse = async () => {
    const result = await pickOutputDirectory();
    if (result) setFolderPath(result.path);
  };

  const handleSave = () => {
    onUpdate({ folderPath });
    onBack();
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h2>Assets Settings</h2>
        <button className="btn-icon" onClick={onBack} title="Back">&#10005;</button>
      </div>

      <div className="settings-field">
        <label>Google Drive Folder</label>
        <div className="input-row">
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder={"e.g. G:\\My Drive\\itGenius PR Assets"}
          />
          <button className="btn-small" onClick={handleBrowse}>Browse</button>
        </div>
        <div className="settings-hint">
          Pick any folder inside your Google Drive for Desktop mount. The extension creates
          Logos / Graphics / Video / Audio / Templates subfolders inside it on first use.
        </div>
      </div>

      <div className="settings-actions">
        <button className="btn-primary" onClick={handleSave} disabled={!folderPath}>
          Save
        </button>
      </div>
    </div>
  );
};
