import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-[3px]",
    lg: "w-10 h-10 border-4",
  };

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
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

export default React.memo(LoadingSpinner);
