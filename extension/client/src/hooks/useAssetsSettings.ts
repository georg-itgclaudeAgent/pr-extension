import { useState, useCallback } from "react";
import { AssetsSettings, DEFAULT_ASSETS_SETTINGS } from "../types";

const STORAGE_KEY = "pr-extension-assets-settings";

function loadSettings(): AssetsSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_ASSETS_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load Assets settings:", e);
  }
  return { ...DEFAULT_ASSETS_SETTINGS };
}

function saveSettings(settings: AssetsSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save Assets settings:", e);
  }
}

export function useAssetsSettings() {
  const [settings, setSettings] = useState<AssetsSettings>(loadSettings);

  const updateSettings = useCallback((updates: Partial<AssetsSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  const isConfigured = settings.folderPath.length > 0;

  return { settings, updateSettings, isConfigured };
}
