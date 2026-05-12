export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  preview_url: string | null;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  speed: number;
  use_speaker_boost: boolean;
}

export interface GenerateRequest {
  text: string;
  model_id: string;
  voice_settings: VoiceSettings;
}

export interface AppSettings {
  apiKey: string;
  outputDirectory: string;
  outputDirectoryToken: string;
  lastVoiceId: string;
  overrideEnabled: boolean;
  voiceSettings: VoiceSettings;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  speed: 1.0,
  use_speaker_boost: true,
};

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: "",
  outputDirectory: "",
  outputDirectoryToken: "",
  lastVoiceId: "",
  overrideEnabled: false,
  voiceSettings: { ...DEFAULT_VOICE_SETTINGS },
};

// ── HeyGen Types ────────────────────────────────────────────────────────

export interface HeyGenAvatar {
  group_id: string;
  name: string;
  avatar_type: string;
}

export interface HeyGenAvatarLook {
  id: string;
  name: string;
  image_url: string | null;
}

export type MotionEngine = "v3" | "v4" | "v5";
export type MotionStyle = "original" | "circle";
export type VideoLayout = "landscape" | "portrait";

export interface HeyGenSettings {
  apiKey: string;
  outputDirectory: string;
  lastAvatarGroupId: string;
  lastAvatarLookId: string;
  motionEngine: MotionEngine;
  motionStyle: MotionStyle;
  layout: VideoLayout;
}

export const DEFAULT_HEYGEN_SETTINGS: HeyGenSettings = {
  apiKey: "",
  outputDirectory: "",
  lastAvatarGroupId: "",
  lastAvatarLookId: "",
  motionEngine: "v5",
  motionStyle: "original",
  layout: "landscape",
};

export interface TransferredAudio {
  data: ArrayBuffer;
  filename: string;
  size: number;
}

// ── Assets Tab Types ────────────────────────────────────────────────────

export type AssetCategory = "Logos" | "Graphics" | "Video" | "Audio" | "Templates";

export const ASSET_CATEGORIES: AssetCategory[] = [
  "Logos",
  "Graphics",
  "Video",
  "Audio",
  "Templates",
];

export interface Asset {
  id: string;          // absolute file path (also used as React key)
  name: string;        // basename
  size: number;        // bytes
  modifiedTime: string; // ISO 8601
  mimeType: string;    // inferred from extension
  category: AssetCategory;
}

export interface AssetsSettings {
  folderPath: string;  // absolute filesystem path inside the Drive for Desktop mount
}

export const DEFAULT_ASSETS_SETTINGS: AssetsSettings = {
  folderPath: "",
};
