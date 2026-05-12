import React from "react";
import { HeyGenAvatar } from "../types";

interface AvatarSelectorProps {
  avatars: HeyGenAvatar[];
  selectedGroupId: string;
  onSelect: (groupId: string) => void;
  loading: boolean;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  avatars,
  selectedGroupId,
  onSelect,
  loading,
}) => {
  if (loading) {
    return <div className="voice-selector">Loading avatars...</div>;
  }

  if (avatars.length === 0) {
    return (
      <div className="voice-selector">
        <p className="no-voices">No digital twin avatars found in your HeyGen account.</p>
      </div>
    );
  }

  return (
    <div className="voice-selector">
      <label>Avatar</label>
      <select
        value={selectedGroupId}
        onChange={(e) => onSelect(e.target.value)}
      >
        {avatars.map((avatar) => (
          <option key={avatar.group_id} value={avatar.group_id}>
            {avatar.name}
          </option>
        ))}
      </select>
    </div>
  );
};
