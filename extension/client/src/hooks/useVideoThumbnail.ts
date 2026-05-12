import { useEffect, useState } from "react";

// Module-level cache so thumbnails persist across re-renders / tab switches.
const cache = new Map<string, { thumb: string; durationSec: number }>();

interface VideoMeta {
  thumb: string | null;
  durationSec: number | null;
}

function fileUrl(absPath: string): string {
  return "file:///" + encodeURI(absPath.replace(/\\/g, "/"));
}

/**
 * Loads a video file via a hidden <video> element, seeks to ~1s, draws a frame
 * to a canvas, and returns a JPEG data URL plus the duration. Cached by path.
 */
export function useVideoThumbnail(filePath: string, enabled: boolean): VideoMeta {
  const cached = cache.get(filePath);
  const [thumb, setThumb] = useState<string | null>(cached?.thumb ?? null);
  const [durationSec, setDurationSec] = useState<number | null>(cached?.durationSec ?? null);

  useEffect(() => {
    if (!enabled) return;
    if (cache.has(filePath)) {
      const c = cache.get(filePath)!;
      setThumb(c.thumb);
      setDurationSec(c.durationSec);
      return;
    }

    let cancelled = false;
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.crossOrigin = "anonymous";
    video.src = fileUrl(filePath);

    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      try { video.pause(); video.removeAttribute("src"); video.load(); } catch (_) {}
    };

    const onLoaded = () => {
      if (cancelled) return;
      const dur = isFinite(video.duration) ? video.duration : null;
      if (dur !== null) setDurationSec(dur);
      // Seek to 1 second or 25% of the way through, whichever is shorter
      const target = dur === null ? 0 : Math.min(1, dur / 4);
      try { video.currentTime = target; } catch (_) {}
    };

    const onSeeked = () => {
      if (cancelled) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) { cleanup(); return; }
      const TARGET_W = 320;
      const canvas = document.createElement("canvas");
      canvas.width = TARGET_W;
      canvas.height = Math.round((TARGET_W * h) / w);
      const ctx = canvas.getContext("2d");
      if (!ctx) { cleanup(); return; }
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        const dur = isFinite(video.duration) ? video.duration : 0;
        cache.set(filePath, { thumb: dataUrl, durationSec: dur });
        if (!cancelled) {
          setThumb(dataUrl);
          setDurationSec(dur);
        }
      } catch (e) {
        // Tainted-canvas or other: silently fall back to placeholder
      }
      cleanup();
    };

    const onError = () => {
      cleanup();
    };

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [filePath, enabled]);

  return { thumb, durationSec };
}
