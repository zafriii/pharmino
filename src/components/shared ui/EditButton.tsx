import React from "react";
import { FiEdit3 } from "react-icons/fi";

interface ActionButtonProps {
  onClick: () => void;
  ariaLabel: string;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
}

const EditButton = ({
  onClick,
  ariaLabel,
  variant = "primary",
  disabled = false,
}: ActionButtonProps) => {
  const baseClasses =
    "p-2 rounded-xl transition-colors focus:outline-none focus:ring-2 flex items-center justify-center";

  const variants = {
    primary: "bg-[#059669] text-white hover:bg-emerald-700 focus:ring-[#059669]",
    secondary: "bg-[#F1F5F9] text-gray-900 hover:bg-gray-300 focus:ring-gray-300",
    ghost: "bg-transparent text-gray-900 hover:bg-gray-100 focus:ring-gray-200",
  };

  const disabledClasses =
    "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200 focus:ring-gray-200";

  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title="Edit"
      disabled={disabled}
      className={`${baseClasses} ${disabled ? disabledClasses : variants[variant]}`}
    >
      <FiEdit3 size={18} />
    </button>
  );
};

export default EditButton;
