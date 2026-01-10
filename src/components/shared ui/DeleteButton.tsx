import React from 'react';
import { RiDeleteBinLine } from "react-icons/ri";

interface ActionButtonProps {
  onClick: () => void;
  ariaLabel: string;
  disabled?: boolean;
}

const DeleteButton = ({ onClick, ariaLabel, disabled = false }: ActionButtonProps) => {
  const baseClasses = `
    p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 flex items-center justify-center
  `;

  const enabledClasses = `
    bg-[#FEF2F2] text-[#DC2626] hover:bg-red-100 focus:ring-red-400 focus:ring-opacity-50
  `;

  const disabledClasses = `
    bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200 focus:ring-gray-200
  `;

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title="Delete"
      disabled={disabled}
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
    >
      <RiDeleteBinLine size={18} />
    </button>
  );
};

export default DeleteButton;
