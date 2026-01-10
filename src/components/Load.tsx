"use client";

import React from "react";
import { BiLoaderCircle } from "react-icons/bi";

interface LoadProps {
  message?: string;
}

const Load: React.FC<LoadProps> = ({ message = "Loading" }) => {
  return (
    <div className="flex flex-row items-center justify-center gap-4 py-10 text-gray-500">
      <span>{message}</span>
      <div className="animate-spin">
        <BiLoaderCircle size={28} color="#4a90e2" />
      </div>
    </div>
  );
};

export default Load;
