import React from "react";
import { LuDownload } from "react-icons/lu";

interface DownloadButtonProps {
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean; 
}

const DownloadButton = ({ onClick, ariaLabel, disabled = false }: DownloadButtonProps) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title="Download"
      disabled={disabled} 
      className={`
        p-2 rounded-xl transition-colors focus:outline-none focus:ring-2
        flex items-center justify-center
        bg-[#F1F5F9] text-gray-900 hover:bg-gray-300 focus:ring-gray-300
        ${disabled ? "opacity-50 cursor-not-allowed hover:bg-inherit" : ""}
      `}
    >
      <LuDownload size={18} />
    </button>
  );
};

export default DownloadButton;
