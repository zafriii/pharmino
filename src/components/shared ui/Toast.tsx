"use client";

import React, { useEffect, useState } from "react";
import { GoCheck } from "react-icons/go";
import { RxCross2 } from "react-icons/rx";
import { AiOutlineWarning } from "react-icons/ai";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "fail" | "info";
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 1000, onClose }) => {
  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setVisible(false);
        onClose?.();
      }, 100);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 100);
  };

  if (!visible) return null;

  const toastType: "success" | "error" | "fail" | "info" = type
    ? type
    : (() => {
        const lastWord = message.trim().split(" ").pop()?.toLowerCase();
        if (lastWord === "successfully!") return "success";
        if (lastWord === "failed") return "fail";
        return "error";
      })();

  let bgColor = "";
  let iconBgColor = "";
  let Icon = null;

  switch (toastType) {
    case "success":
      bgColor = "bg-white text-green-900 border-green-300";
      iconBgColor = "bg-green-300";
      Icon = <GoCheck size={16} className="text-green-700" />;
      break;

    case "error":
      bgColor = "bg-white text-yellow-900 border-yellow-300";
      iconBgColor = "bg-yellow-300";
      Icon = <AiOutlineWarning size={16} className="text-yellow-700" />;
      break;

    case "fail":
      bgColor = "bg-white text-red-900 border-red-300";
      iconBgColor = "bg-red-300";
      Icon = <RxCross2 size={16} className="text-red-700" />;
      break;

    case "info":
      bgColor = "bg-white text-blue-900 border-blue-300";
      iconBgColor = "bg-blue-300";
      Icon = <AiOutlineWarning size={16} className="text-blue-700" />;
      break;
  }

  return (
    <div
      className={`
        fixed bottom-4 left-4
        flex items-center gap-3 z-50
        rounded-xl px-4 py-3 shadow-lg border backdrop-blur-sm
        transform transition-all duration-300
        ${bgColor}
        ${isExiting
          ? "translate-x-[-120%] scale-95 opacity-0"
          : "translate-x-0 scale-100 opacity-100"
        }
      `}
    >
      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${iconBgColor}`}>
        {Icon}
      </div>

      <span className="font-medium">{message}</span>

      <button
        className="ml-2 p-1 rounded-full hover:bg-black/10 transition-colors"
        onClick={handleClose}
      >
        <RxCross2 size={16} className="opacity-70 hover:opacity-100" />
      </button>
    </div>
  );
};

export default Toast;
