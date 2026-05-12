import { useState, useCallback } from "react";
import { HeyGenSettings, DEFAULT_HEYGEN_SETTINGS } from "../types";

const STORAGE_KEY = "pr-extension-heygen-settings";

function loadSettings(): HeyGenSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_HEYGEN_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error("Failed to load HeyGen settings:", e);
  }
  return { ...DEFAULT_HEYGEN_SETTINGS };
}

function saveSettings(settings: HeyGenSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save HeyGen settings:", e);
  }
}

export function useHeyGenSettings() {
  const [settings, setSettings] = useState<HeyGenSettings>(loadSettings);

  const updateSettings = useCallback((updates: Partial<HeyGenSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      saveSettings(next);
      return next;
    });
  }, []);

  const isConfigured = settings.apiKey.length > 0;

  return { settings, updateSettings, isConfigured };
}
