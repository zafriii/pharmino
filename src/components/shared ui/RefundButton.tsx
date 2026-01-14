"use client";

import React from "react";
import { RiRefund2Line } from "react-icons/ri";

interface RefundButtonProps {
  onClick: () => void;
  ariaLabel: string;
  variant?: "primary" | "secondary" ;
  disabled?: boolean;
}

const RefundButton = ({
  onClick,
  ariaLabel,
  variant = "primary",
  disabled = false,
}: RefundButtonProps) => {
  const baseClasses =
    "p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 flex items-center justify-center";

  const variants = {
    primary: "bg-[#4a90e2] text-white hover:bg-emerald-700 focus:ring-[#059669]",
    secondary:
      "bg-[#F1F5F9] text-gray-900 hover:bg-gray-300 focus:ring-gray-300",
  };

  const disabledClasses =
    "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200 focus:ring-gray-200";

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title="Refund"
      disabled={disabled}
      className={`${baseClasses} ${
        disabled ? disabledClasses : variants[variant]
      }`}
    >
      <RiRefund2Line size={20} />
    </button>
  );
};

export default RefundButton;
