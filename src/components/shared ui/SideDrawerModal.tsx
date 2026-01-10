'use client';

import React, { ReactNode } from "react";
import { RxCross2 } from "react-icons/rx";

interface SideDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footerButtons?: ReactNode;
  width?: string;  
}

const SideDrawerModal: React.FC<SideDrawerModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerButtons,
  width = "w-full md:w-[480px]",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">

      {/* Background Overlay */}
      <div
        className="absolute inset-0 bg-transparent bg-opacity-30 backdrop-blur-[1.5px] animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Drawer Panel */}
      <div
        className={`fixed top-6 bottom-6 right-6 transform ${width} transition-transform duration-300 ease-out animate-slideIn flex flex-col`}
      >
        <div className="h-full bg-white shadow-xl rounded-2xl flex flex-col">

          {/* Header */}
          <div className="px-6 py-4 flex items-center justify-between flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={onClose}
            >
              <RxCross2 className="h-6 w-6" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {children}
            </div>
          </div>

          {/* Footer buttons */}
          {footerButtons && (
            <div className="px-6 py-4 flex-shrink-0">
              <div className="grid grid-cols-2 gap-3">
                {footerButtons}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SideDrawerModal;