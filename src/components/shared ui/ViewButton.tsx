"use client";

import React from "react";
import { FiEye } from "react-icons/fi";

interface ViewButtonProps {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  size?: number;
}

export default function ViewButton({
  onClick,
  disabled = false,
  ariaLabel = "View details",
  size = 18,
}: ViewButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="
        p-2
        rounded-xl
        bg-blue-50
        text-blue-600
        hover:bg-blue-100
        disabled:opacity-50
        disabled:cursor-not-allowed
        transition-colors
      "
    >
      <FiEye size={size} />
    </button>
  );
}
