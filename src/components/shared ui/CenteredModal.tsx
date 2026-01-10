"use client";

import React, { ReactNode } from "react";
import { RxCross2 } from "react-icons/rx";

interface CenteredModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footerButtons?: ReactNode;
  width?: string; // modal width
}

const CenteredModal: React.FC<CenteredModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerButtons,
  width = "w-full max-w-md",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">

      {/* Background Overlay */}
      <div
        className="
        absolute inset-0 
          bg-transparent bg-opacity-30 
          backdrop-blur-[1.5px]
          animate-fadeIn
        "
        onClick={onClose}
      ></div>

      {/* Modal Panel */}
      <div
        className={`
          relative bg-white rounded-2xl shadow-xl flex flex-col
          ${width} max-h-[90vh] overflow-hidden animate-scaleIn
        `}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between ">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={onClose}
          >
            <RxCross2 className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footerButtons && (
          <div className="px-6 py-4 ">
            <div className="flex justify-end gap-3">
              {footerButtons}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CenteredModal;
