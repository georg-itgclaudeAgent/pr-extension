import React from "react";
import { AssetCategory, ASSET_CATEGORIES } from "../types";

interface CategoryPillsProps {
  selected: AssetCategory | "All";
  counts: Record<AssetCategory | "All", number>;
  onSelect: (cat: AssetCategory | "All") => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({ selected, counts, onSelect }) => {
  const all = ["All", ...ASSET_CATEGORIES] as Array<AssetCategory | "All">;
  return (
    <div className="category-pills">
      {all.map((cat) => (
        <button
          key={cat}
          className={`pill ${selected === cat ? "active" : ""}`}
          onClick={() => onSelect(cat)}
        >
          {cat} <span className="pill-count">{counts[cat] ?? 0}</span>
        </button>
      ))}
    </div>
  );
};
