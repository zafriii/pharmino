
'use client';

import React from "react";
import { RxCross2 } from "react-icons/rx";

interface CrossButtonProps {
  onClick: () => void;
  ariaLabel: string;
  title?: string; 
  isActive?: boolean; 
  disabled?: boolean;   
  className?: string;
}

const CrossButton = ({
  onClick,
  ariaLabel,
  title = "Mark Absent",
  isActive = false,
  disabled = false,   
  className = ""
}: CrossButtonProps) => {
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
        focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50

        ${isActive
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-[#FEE2E2] text-[#DC2626] hover:bg-red-100'
        }

        ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-[#FEE2E2]' : ''}  // ⭐ Disabled styles

        ${className}
      `}
    >
      <RxCross2 size={18} />
    </button>
  );
};

export default CrossButton;
