import { HeyGenAvatar, HeyGenAvatarLook, MotionEngine, MotionStyle, VideoLayout } from "../types";

const BASE_URL = "https://api.heygen.com";

async function apiRequest(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "X-Api-Key": apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HeyGen API error (${response.status}): ${errorText}`);
  }

  return response;
}

export async function listDigitalTwins(apiKey: string): Promise<HeyGenAvatar[]> {
  const response = await apiRequest("/v3/avatars?ownership=private", apiKey);
  const data = await response.json();
  const avatars: HeyGenAvatar[] = data.data?.avatars || [];
  return avatars.filter(
    (a) => a.avatar_type === "digital_twin"
  );
}

export async function getAvatarLooks(
  apiKey: string,
  groupId: string
): Promise<HeyGenAvatarLook[]> {
  const response = await apiRequest(`/v3/avatars/${groupId}`, apiKey);
  const data = await response.json();
  return data.data?.looks || [];
}

export async function uploadAudioAsset(
  apiKey: string,
  audioData: ArrayBuffer,
  filename: string
): Promise<string> {
  const blob = new Blob([audioData], { type: "audio/mpeg" });
  const formData = new FormData();
  formData.append("file", blob, filename);

  const response = await fetch(`${BASE_URL}/v3/assets`, {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HeyGen upload error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.data?.asset_id || data.data?.id;
}

export interface CreateVideoOptions {
  avatarLookId: string;
  audioAssetId: string;
  motionEngine: MotionEngine;
  motionStyle: MotionStyle;
  layout: VideoLayout;
}

export async function createVideo(
  apiKey: string,
  options: CreateVideoOptions
): Promise<string> {
  const response = await apiRequest("/v3/videos", apiKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "avatar",
      avatar_id: options.avatarLookId,
      audio: { type: "asset_id", asset_id: options.audioAssetId },
      avatar_style: options.motionStyle,
      orientation: options.layout,
    }),
  });

  const data = await response.json();
  return data.data?.video_id;
}

export interface VideoStatus {
  status: "pending" | "processing" | "completed" | "failed";
  video_url?: string;
  failure_message?: string;
  duration?: number;
}

export async function getVideoStatus(
  apiKey: string,
  videoId: string
): Promise<VideoStatus> {
  const response = await apiRequest(`/v3/videos/${videoId}`, apiKey);
  const data = await response.json();
  return {
    status: data.data?.status || "pending",
    video_url: data.data?.video_url,
    failure_message: data.data?.failure_message,
    duration: data.data?.duration,
  };
}

export async function getCredits(
  apiKey: string
): Promise<{ remaining: number } | null> {
  try {
    const response = await apiRequest("/v3/users/me", apiKey);
    const data = await response.json();
    const remaining = data.data?.remaining_credits ?? data.data?.credits ?? null;
    if (remaining !== null) {
      return { remaining };
    }
    return null;
  } catch (err) {
    console.error("HeyGen credits fetch failed:", err);
    return null;
  }
}

export async function testHeyGenConnection(
  apiKey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const credits = await getCredits(apiKey);
    if (credits !== null) {
      return { success: true };
    }
    return { success: false, error: "Could not retrieve account info." };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
