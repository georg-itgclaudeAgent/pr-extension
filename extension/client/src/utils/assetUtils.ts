import { Asset } from "../types";

export function formatBytes(b: number): string {
  if (b < 1024) return b + " B";
  if (b < 1024 ** 2) return (b / 1024).toFixed(1) + " KB";
  if (b < 1024 ** 3) return (b / 1024 ** 2).toFixed(1) + " MB";
  return (b / 1024 ** 3).toFixed(2) + " GB";
}

export function fileTypeLabel(asset: Asset): string {
  const dot = asset.name.lastIndexOf(".");
  if (dot >= 0) return asset.name.slice(dot + 1).toUpperCase();
  return asset.mimeType.split("/")[1]?.toUpperCase() || "FILE";
}
