"use client";

import React from "react";

interface SwitchButtonProps {
  value: "AVAILABLE" | "UNAVAILABLE";
  onChange: (newValue: "AVAILABLE" | "UNAVAILABLE") => void;
}

const SwitchButton: React.FC<SwitchButtonProps> = ({ value, onChange }) => {
  const isAvailable = value === "AVAILABLE";

  const handleToggle = () => {
    onChange(isAvailable ? "UNAVAILABLE" : "AVAILABLE");
  };

  return (
    <div
      className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200
        ${isAvailable ? "bg-[#4a90e2]" : "bg-[#E2E8F0]"}`}
      onClick={handleToggle}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-200
        ${isAvailable ? "translate-x-6" : "translate-x-0"}`}
      ></div>
    </div>
  );
};

export default SwitchButton;
