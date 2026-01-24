'use client';

import React, { useState } from "react";
import Button from "@/components/shared ui/Button";
import { RxCross2 } from "react-icons/rx";
import { GoCheck } from "react-icons/go";
import { ImSpinner2 } from 'react-icons/im';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Confirm",
  message = "Are you sure?",
  onConfirm,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        
        <h2 className="text-lg font-semibold mb-3">
          {title}
        </h2>

        <p className="text-gray-600 mb-6 whitespace-normal break-words">
          {message}
        </p>

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            leftIcon={<RxCross2 />}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            leftIcon={
              isLoading ? (
                <ImSpinner2 className="animate-spin w-4 h-4" />
              ) : (
                <GoCheck className="w-4 h-4" />
              )
            }
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Confirming" : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
