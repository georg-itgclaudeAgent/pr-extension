import { useState, useEffect, useCallback, useRef } from "react";
import { Asset, AssetCategory, ASSET_CATEGORIES } from "../types";

declare global {
  interface Window { cep_node: { require: (id: string) => any }; }
}

interface UseAssetsArgs {
  folderPath: string;
  enabled: boolean;
}

interface UseAssetsResult {
  assetsByCategory: Record<AssetCategory, Asset[]>;
  counts: Record<AssetCategory | "All", number>;
  totalCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  categoryFolderPaths: Record<AssetCategory, string>;
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".mxf": "application/mxf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".aac": "audio/aac",
  ".m4a": "audio/mp4",
  ".aiff": "audio/aiff",
  ".flac": "audio/flac",
  ".mogrt": "application/vnd.adobe.mogrt",
};

function nodeRequire<T = any>(id: string): T {
  if (!window.cep_node) throw new Error("cep_node not available");
  return window.cep_node.require(id);
}

function mimeFromName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "application/octet-stream";
  return MIME_BY_EXT[name.slice(dot).toLowerCase()] || "application/octet-stream";
}

export function useAssets({ folderPath, enabled }: UseAssetsArgs): UseAssetsResult {
  const [assetsByCategory, setAssetsByCategory] = useState<Record<AssetCategory, Asset[]>>({
    Logos: [], Graphics: [], Video: [], Audio: [], Templates: [],
  });
  const [categoryFolderPaths, setCategoryFolderPaths] = useState<Record<AssetCategory, string>>({
    Logos: "", Graphics: "", Video: "", Audio: "", Templates: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!enabled || !folderPath) return;
    const myId = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const fs = nodeRequire("fs");
      const path = nodeRequire("path");

      if (!fs.existsSync(folderPath)) {
        throw new Error(`Folder not found: ${folderPath}`);
      }

      const folderPaths: Record<AssetCategory, string> = {
        Logos: "", Graphics: "", Video: "", Audio: "", Templates: "",
      };

      const next: Record<AssetCategory, Asset[]> = {
        Logos: [], Graphics: [], Video: [], Audio: [], Templates: [],
      };

      for (const cat of ASSET_CATEGORIES) {
        const catPath = path.join(folderPath, cat);
        if (!fs.existsSync(catPath)) {
          fs.mkdirSync(catPath, { recursive: true });
        }
        folderPaths[cat] = catPath;

        const entries = fs.readdirSync(catPath, { withFileTypes: true }) as any[];
        const files: Asset[] = [];
        for (const entry of entries) {
          if (entry.isDirectory()) continue;
          if (entry.name.startsWith(".")) continue;
          const filePath = path.join(catPath, entry.name);
          let stat;
          try { stat = fs.statSync(filePath); } catch (_) { continue; }
          files.push({
            id: filePath,
            name: entry.name,
            size: stat.size,
            modifiedTime: new Date(stat.mtimeMs).toISOString(),
            mimeType: mimeFromName(entry.name),
            category: cat,
          });
        }
        files.sort((a, b) => a.name.localeCompare(b.name));
        next[cat] = files;
      }

      if (myId !== requestId.current) return;
      setAssetsByCategory(next);
      setCategoryFolderPaths(folderPaths);
    } catch (e: any) {
      if (myId !== requestId.current) return;
      setError(e?.message || String(e));
    } finally {
      if (myId === requestId.current) setLoading(false);
    }
  }, [folderPath, enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const counts: Record<AssetCategory | "All", number> = {
    Logos: assetsByCategory.Logos.length,
    Graphics: assetsByCategory.Graphics.length,
    Video: assetsByCategory.Video.length,
    Audio: assetsByCategory.Audio.length,
    Templates: assetsByCategory.Templates.length,
    All: ASSET_CATEGORIES.reduce((s, c) => s + assetsByCategory[c].length, 0),
  };
  const totalCount = counts.All;

  return { assetsByCategory, counts, totalCount, loading, error, refresh, categoryFolderPaths };
}
