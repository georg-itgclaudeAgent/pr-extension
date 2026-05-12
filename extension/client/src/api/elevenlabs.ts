import { Voice, VoiceSettings } from "../types";

const BASE_URL = "https://api.elevenlabs.io/v1";

async function apiRequest(
  endpoint: string,
  apiKey: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "xi-api-key": apiKey,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  return response;
}

export async function listClonedVoices(apiKey: string): Promise<Voice[]> {
  const response = await apiRequest("/voices", apiKey);
  const data = await response.json();
  const voices: Voice[] = data.voices || [];
  return voices.filter(
    (v: Voice) => v.category === "cloned" || v.category === "professional"
  );
}

export async function testConnection(
  apiKey: string
): Promise<{ success: boolean; voiceCount: number; error?: string }> {
  try {
    const voices = await listClonedVoices(apiKey);
    return { success: true, voiceCount: voices.length };
  } catch (err: any) {
    return { success: false, voiceCount: 0, error: err.message };
  }
}

export async function getRemainingCredits(
  apiKey: string
): Promise<{ remaining: number; limit: number } | null> {
  try {
    // Try /user first (less restrictive permissions), fall back to /user/subscription
    let response = await fetch(`${BASE_URL}/user`, {
      headers: { "xi-api-key": apiKey },
    });
    if (response.ok) {
      const data = await response.json();
      const sub = data.subscription;
      if (sub) {
        const limit = sub.character_limit || 0;
        const used = sub.character_count || 0;
        return { remaining: limit - used, limit };
      }
    }

    // Fallback to /user/subscription
    response = await fetch(`${BASE_URL}/user/subscription`, {
      headers: { "xi-api-key": apiKey },
    });
    if (!response.ok) {
      console.error("ElevenLabs credits API error:", response.status);
      return null;
    }
    const data = await response.json();
    const limit = data.character_limit || 0;
    const used = data.character_count || 0;
    return { remaining: limit - used, limit };
  } catch (err) {
    console.error("ElevenLabs credits fetch failed:", err);
    return null;
  }
}

export async function generateSpeech(
  apiKey: string,
  voiceId: string,
  text: string,
  settings: VoiceSettings
): Promise<ArrayBuffer> {
  const response = await apiRequest(
    `/text-to-speech/${voiceId}`,
    apiKey,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarity_boost,
          style: settings.style,
          speed: settings.speed,
          use_speaker_boost: settings.use_speaker_boost,
        },
      }),
    }
  );

  return await response.arrayBuffer();
}
