'use client';

import React from "react";
import { TbPackageImport } from "react-icons/tb";

interface BackToInventoryButtonProps {
  onClick: () => void;
  ariaLabel: string;
  title?: string; 
  isActive?: boolean; 
  disabled?: boolean;
  className?: string;
}

const BackToInventoryButton = ({
  onClick,
  ariaLabel,
  title = "Back to Inventory",
  isActive = false,
  disabled = false,
  className = ""
}: BackToInventoryButtonProps) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      className={`
        p-2
        rounded-xl
        transition-colors
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50

        ${isActive
          ? 'bg-blue-500 text-white hover:bg-blue-600'
          : 'bg-[#DBEAFE] text-[#1D4ED8] hover:bg-blue-100'
        }

        ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-[#DBEAFE]' : ''}

        ${className}
      `}
    >
      <TbPackageImport size={18} />
    </button>
  );
};

export default BackToInventoryButton;