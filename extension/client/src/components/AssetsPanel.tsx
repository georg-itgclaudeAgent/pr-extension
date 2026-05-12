import React, { useState, useMemo, useEffect, useRef } from "react";
import { Asset, AssetCategory, ASSET_CATEGORIES, AssetsSettings } from "../types";
import { AssetsHeader } from "./AssetsHeader";
import { CategoryPills } from "./CategoryPills";
import { AssetCard } from "./AssetCard";
import { useAssets } from "../hooks/useAssets";
import { insertAssetAtPlayhead } from "../utils/premiere";

declare global {
  interface Window { cep_node: { require: (id: string) => any }; }
}

interface AssetsPanelProps {
  settings: AssetsSettings;
  onUpdate: (updates: Partial<AssetsSettings>) => void;
  onOpenSettings: () => void;
}

function nodeRequire<T = any>(id: string): T {
  if (!(window as any).cep_node) throw new Error("cep_node not available");
  return (window as any).cep_node.require(id);
}

function isExternalFileDrag(e: React.DragEvent): boolean {
  // dataTransfer.types is a DOMStringList in some browsers, array-like in others.
  const types = e.dataTransfer.types;
  for (let i = 0; i < types.length; i++) {
    if (types[i] === "Files") return true;
  }
  return false;
}

export const AssetsPanel: React.FC<AssetsPanelProps> = ({
  settings,
  onUpdate,
  onOpenSettings,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | "All">("All");
  const [search, setSearch] = useState("");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<
    { x: number; y: number; asset: Asset; confirming: boolean } | null
  >(null);
  const dragDepthRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabled = !!settings.folderPath;

  const {
    assetsByCategory,
    counts,
    totalCount,
    loading,
    error,
    refresh,
    categoryFolderPaths,
  } = useAssets({
    folderPath: settings.folderPath,
    enabled,
  });

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  // Close the context menu on outside click or Escape.
  useEffect(() => {
    if (!contextMenu) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".context-menu")) {
        setContextMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    // Defer the listener so the click that opened the menu doesn't immediately close it.
    const t = setTimeout(() => document.addEventListener("mousedown", onDocMouseDown), 0);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [contextMenu]);

  const visibleAssets = useMemo<Asset[]>(() => {
    let list: Asset[];
    if (selectedCategory === "All") {
      list = ASSET_CATEGORIES.flatMap((c) => assetsByCategory[c]);
    } else {
      list = assetsByCategory[selectedCategory];
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    return list;
  }, [assetsByCategory, selectedCategory, search]);

  /* ── Upload (copy file into category subfolder) ─────────────── */

  const handleUpload = async (files: File[]) => {
    if (uploading) return;

    // Auto-categorize when no specific category is selected; otherwise everything
    // goes to the selected category (manual override).
    const routeFor = (file: File): AssetCategory => {
      if (selectedCategory !== "All") return selectedCategory;
      const type = file.type || "";
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf(".") + 1);
      if (type.startsWith("image/")) return "Graphics";
      if (type.startsWith("video/")) return "Video";
      if (type.startsWith("audio/")) return "Audio";
      if (ext === "mogrt" || ext === "aep" || ext === "prproj") return "Templates";
      // Fallback by extension when File.type is empty (common on Windows for some types)
      if (["png", "jpg", "jpeg", "gif", "bmp", "tif", "tiff", "webp", "svg"].includes(ext)) return "Graphics";
      if (["mp4", "mov", "avi", "mkv", "mxf"].includes(ext)) return "Video";
      if (["mp3", "wav", "aac", "m4a", "aiff", "flac"].includes(ext)) return "Audio";
      return "Graphics"; // catch-all
    };

    setUploading(true);
    try {
      const fs = nodeRequire("fs");
      const path = nodeRequire("path");
      const counts: Partial<Record<AssetCategory, number>> = {};
      for (const file of files) {
        const cat = routeFor(file);
        const targetPath = categoryFolderPaths[cat];
        if (!targetPath) { showToast(`Category folder for ${cat} not ready — try refresh.`); continue; }
        const buf = await file.arrayBuffer();
        const dest = path.join(targetPath, file.name);
        fs.writeFileSync(dest, Buffer.from(buf));
        counts[cat] = (counts[cat] || 0) + 1;
      }
      await refresh();
      const summary = Object.entries(counts)
        .map(([c, n]) => `${n} to ${c}`)
        .join(", ");
      if (summary) showToast(`Saved: ${summary}`);
    } catch (e: any) {
      showToast(`Save failed: ${e?.message || e}`);
    } finally {
      setUploading(false);
    }
  };

  /* ── Panel-level drop handling (the whole panel is a drop target) ── */

  const handlePanelDragEnter = (e: React.DragEvent) => {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    dragDepthRef.current++;
    if (!dragOver) setDragOver(true);
  };

  const handlePanelDragOver = (e: React.DragEvent) => {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handlePanelDragLeave = (e: React.DragEvent) => {
    if (!isExternalFileDrag(e)) return;
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragOver(false);
  };

  const handlePanelDrop = (e: React.DragEvent) => {
    if (!isExternalFileDrag(e)) return;
    e.preventDefault();
    dragDepthRef.current = 0;
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleUpload(files);
  };

  /* ── Click-to-insert at playhead (also the drag fallback) ─────── */

  const handleCardClick = async (asset: Asset) => {
    setBusyIds((s) => new Set(s).add(asset.id));
    try {
      const result = await insertAssetAtPlayhead(asset.id);
      if (result === "bin-only") {
        showToast(`${asset.name} imported to bin (not auto-inserted)`);
      } else {
        showToast(`${asset.name} added to timeline`);
      }
    } catch (e: any) {
      showToast(`Insert failed: ${e?.message || e}`);
    } finally {
      setBusyIds((s) => { const n = new Set(s); n.delete(asset.id); return n; });
    }
  };

  /* ── Right-click → context menu (Delete) ───────────────────── */

  const handleCardContextMenu = (e: React.MouseEvent, asset: Asset) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, asset, confirming: false });
  };

  const handleDeleteAsset = async (asset: Asset) => {
    setContextMenu(null);
    try {
      const fs = nodeRequire("fs");
      fs.unlinkSync(asset.id);
      showToast(`Deleted ${asset.name}`);
      await refresh();
    } catch (e: any) {
      showToast(`Delete failed: ${e?.message || e}`);
    }
  };

  /* ── Render ────────────────────────────────────────────────── */

  if (!settings.folderPath) {
    return (
      <div className="assets-panel">
        <AssetsHeader totalCount={0} syncing={false} error={null} onOpenSettings={onOpenSettings} />
        <div className="tab-placeholder">
          <p>Pick your Google Drive folder in settings to see your team library.</p>
          <button className="btn-primary" onClick={onOpenSettings} style={{ marginTop: 12 }}>
            Open Assets Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`assets-panel ${dragOver ? "drop-active" : ""}`}
      onDragEnter={handlePanelDragEnter}
      onDragOver={handlePanelDragOver}
      onDragLeave={handlePanelDragLeave}
      onDrop={handlePanelDrop}
    >
      <AssetsHeader totalCount={totalCount} syncing={loading || uploading} error={error} onOpenSettings={onOpenSettings} />

      <CategoryPills selected={selectedCategory} counts={counts} onSelect={setSelectedCategory} />

      <div className="assets-search">
        <input
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <div className="error-banner">{error} <button className="btn-small" onClick={refresh}>Retry</button></div>}

      <div className="assets-grid">
        {visibleAssets.length === 0 && !loading && (
          <div className="assets-empty">
            {selectedCategory === "All"
              ? "Drop files anywhere on the panel to add them."
              : `No assets in ${selectedCategory}. Drop files to add.`}
          </div>
        )}
        {visibleAssets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            busy={busyIds.has(asset.id)}
            onClick={() => handleCardClick(asset)}
            onDragFallback={() => handleCardClick(asset)}
            onContextMenu={(e) => handleCardContextMenu(e, asset)}
          />
        ))}
      </div>

      <div className="assets-footer">
        <span title={settings.folderPath}>{settings.folderPath}</span>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {contextMenu && (
        <div
          className="context-menu"
          style={{ position: "fixed", left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {!contextMenu.confirming ? (
            <button
              className="context-menu-item delete"
              onClick={() => setContextMenu({ ...contextMenu, confirming: true })}
            >
              Delete
            </button>
          ) : (
            <>
              <div className="context-menu-label" title={contextMenu.asset.name}>
                Delete <strong>{contextMenu.asset.name}</strong>?
              </div>
              <div className="context-menu-actions">
                <button
                  className="context-menu-item delete"
                  onClick={() => handleDeleteAsset(contextMenu.asset)}
                >
                  Yes, delete
                </button>
                <button
                  className="context-menu-item"
                  onClick={() => setContextMenu(null)}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
