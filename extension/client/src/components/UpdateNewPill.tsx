import React from "react";

interface UpdateNewPillProps {
  onClick: () => void;
  title?: string;
}

export const UpdateNewPill: React.FC<UpdateNewPillProps> = ({ onClick, title }) => (
  <button
    className="update-new-pill"
    onClick={onClick}
    title={title || "Update available — click for details"}
  >
    NEW!
  </button>
);
