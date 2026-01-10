"use client";

import React, { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: "primary" | "secondary" | "danger"; 
}

const Button: React.FC<ButtonProps> = ({
  isLoading = false,
  loadingText,
  children,
  leftIcon,
  rightIcon,
  variant = "primary",
  className,
  disabled,
  onClick,
  ...props
}) => {
  const baseClasses = `
    w-full h-9.4 py-2 rounded-[28px] transition-colors duration-200 
    cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
  `;

  const variants = {
    primary: "bg-[#4a90e2] hover:bg-[#3577c4] text-white text-[14px]",
    secondary: "bg-[#F1F5F9] hover:bg-gray-200 text-gray-900 text-[14px]",
    danger: "bg-[#EF4444] hover:bg-red-600 text-white text-[14px]", 
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent click if loading or disabled
    if (isLoading || disabled) {
      e.preventDefault();
      return;
    }
    onClick?.(e);
  };

  return (
    <button
      {...props}
      disabled={isLoading || disabled}
      onClick={handleClick}
      className={`${baseClasses} ${variants[variant]} ${className ?? ""}`}
       
    >
      {isLoading ? (
        <>
          {leftIcon && <span className="flex">{leftIcon}</span>} 
          {loadingText || "Loading..."}
          {rightIcon && <span className="flex">{rightIcon}</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className="flex">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
