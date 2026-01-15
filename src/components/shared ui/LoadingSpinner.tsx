import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "lg",
  className = "",
  fullScreen = true,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-[3px]",
    lg: "w-10 h-10 border-4",
  };

  return (
    <div
      className={`
        ${fullScreen ? "fixed inset-0 z-50 flex items-center justify-center bg-white/70" : "inline-flex"}
        ${className}
      `}
    >
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          border-gray-300
          border-t-blue-500
          animate-spin
        `}
      />
    </div>
  );
};

export default LoadingSpinner;
