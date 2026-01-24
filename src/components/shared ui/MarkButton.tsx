"use client";

import React from "react";
import { GoCheck } from "react-icons/go";

interface MarkButtonProps {
  onClick: () => void;
  ariaLabel: string;
  title?: string; 
  variant?: "secondary" | "success";
  className?: string;
  isActive?: boolean;
  disabled?: boolean; 
}

const MarkButton = ({
  onClick,
  ariaLabel,
  title = "Mark",
  variant = "secondary",
  className = "",
  isActive = false,
  disabled = false, 
}: MarkButtonProps) => {
  const baseClasses =
    "p-2 rounded-xl transition-colors focus:outline-none flex items-center justify-center";

  const variants = {
    secondary:
      "bg-[#F1F5F9] text-gray-900 hover:bg-gray-300 focus:ring-gray-300",
    success:
      "bg-[#ECFDF5] hover:bg-[#D1FAE5] focus:ring-[#A7F3D0] text-[#16A34A]",
  };

  // Determine icon color
  let iconColor = variants[variant].includes("text-[#16A34A]")
    ? "text-[#16A34A]"
    : "";

  // Active styling
  let activeClasses = "";
  if (isActive) {
    activeClasses = "bg-emerald-600 hover:bg-emerald-700 text-white";
    iconColor = "text-white";
  }

  // Disabled styles
  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed hover:bg-inherit"
    : "";

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled} // ✅ applied here
      className={`${baseClasses} ${variants[variant]} ${className} ${activeClasses} ${disabledClasses}`}
    >
      <GoCheck size={18} className={iconColor} />
    </button>
  );
};

export default MarkButton;
