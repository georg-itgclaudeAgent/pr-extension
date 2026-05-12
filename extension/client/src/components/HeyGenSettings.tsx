import React, { useState } from "react";
import { HeyGenSettings } from "../types";
import { testHeyGenConnection } from "../api/heygen";
import { pickOutputDirectory } from "../utils/premiere";

interface HeyGenSettingsProps {
  settings: HeyGenSettings;
  onUpdate: (updates: Partial<HeyGenSettings>) => void;
  onBack: () => void;
}

export const HeyGenSettingsView: React.FC<HeyGenSettingsProps> = ({
  settings,
  onUpdate,
  onBack,
}) => {
  const [apiKey, setApiKey] = useState(settings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTestConnection = async () => {
    if (!apiKey) return;
    setTesting(true);
    setTestResult(null);
    const result = await testHeyGenConnection(apiKey);
    if (result.success) {
      setTestResult("Connected to HeyGen!");
    } else {
      setTestResult(`Failed: ${result.error}`);
    }
    setTesting(false);
  };

  const handlePickDirectory = async () => {
    const result = await pickOutputDirectory();
    if (result) {
      onUpdate({ outputDirectory: result.path });
    }
  };

  const handleSave = () => {
    onUpdate({ apiKey });
    onBack();
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h2>HeyGen Settings</h2>
        <button className="btn-icon" onClick={onBack} title="Back">
          &#10005;
        </button>
      </div>

      <div className="settings-field">
        <label>HeyGen API Key</label>
        <div className="input-row">
          <input
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your HeyGen API key"
          />
          <button className="btn-small" onClick={() => setShowKey(!showKey)}>
            {showKey ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="settings-field">
        <label>Video Output Directory</label>
        <div className="input-row">
          <input
            type="text"
            value={settings.outputDirectory}
            onChange={(e) => onUpdate({ outputDirectory: e.target.value })}
            placeholder="Paste a path or use Browse"
          />
          <button className="btn-small" onClick={handlePickDirectory}>
            Browse
          </button>
        </div>
      </div>

      <div className="settings-actions">
        <button
          className="btn-secondary"
          onClick={handleTestConnection}
          disabled={!apiKey || testing}
        >
          {testing ? "Testing..." : "Test Connection"}
        </button>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={!apiKey}
        >
          Save
        </button>
      </div>

      {testResult && (
        <div
          className={`settings-result ${
            testResult.startsWith("Connected") ? "success" : "error"
          }`}
        >
          {testResult}
        </div>
      )}
    </div>
  );
};
