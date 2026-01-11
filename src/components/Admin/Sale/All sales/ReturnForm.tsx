"use client";

import React, { useState, useTransition } from "react";
import CenteredModal from "@/components/shared ui/CenteredModal";
import Button from "@/components/shared ui/Button";
import Badge from "@/components/shared ui/Badge";
import { Sale } from "@/types/sale.types";
import { returnSaleAction } from "@/actions/sale.actions";
import { GrFormRefresh } from "react-icons/gr";
import { ImSpinner2 } from 'react-icons/im';

interface ReturnFormProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  onSuccess?: () => void;
}

const ReturnForm: React.FC<ReturnFormProps> = ({
  isOpen,
  onClose,
  sale,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleReturn = async () => {
    if (!reason.trim()) {
      alert("Please provide a return reason.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await returnSaleAction(sale.id, reason);
        
        if (result.success) {
          onClose();
          setReason("");
          
          if (onSuccess) onSuccess();
          
          // No alert - just silently update the status
        } else {
          alert(result.error || result.message);
        }
      } catch (error: any) {
        alert(error.message || "Failed to return sale.");
      }
    });
  };

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={onClose}
      title="Return Sale"
      width="w-full max-w-lg"
      footerButtons={
        <>
          <Button variant="secondary" onClick={onClose}>
            No, Don't Return
          </Button>
          <Button 
          variant="danger" 
          leftIcon={
            isPending ? (
            <ImSpinner2 className="animate-spin" />
            ) : (
            <GrFormRefresh size={20}/>
            )
           }
          onClick={handleReturn} 
          disabled={isPending}>
            {isPending ? "Processing" : "Yes, Return"}
          </Button>
        </>
      }
    >
      {/* ITEM LIST */}
      <div className="space-y-3">
        {sale.saleItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between border border-[#E5E5E5] rounded-lg p-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-300 rounded-md overflow-hidden">
                {item.item?.imageUrl && (
                  <img
                    src={item.item.imageUrl}
                    alt={item.item.itemName}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-col">
                <span className="font-medium">{item.item?.itemName}</span>
                <span className="text-sm text-gray-500">x {item.quantity}</span>
              </div>
            </div>
            <span className="font-medium">{item.totalPrice}</span>
          </div>
        ))}
      </div>

      {/* ORDER INFO */}
      <div className="border border-[#E5E5E5] rounded-lg p-3 mt-4 grid grid-cols-2 text-sm">
        <div className="flex flex-col gap-2 font-medium text-gray-700">
          <span>Sale ID:</span>
          <span>Status:</span>
          <span>Total Amount:</span>
          <span>Customer:</span>
          <span>Phone:</span>
          <span>Payment:</span>
        </div>
        <div className="flex flex-col gap-2 text-gray-900 items-end">
          <span># {sale.id}</span>
          <span>
            <Badge variant={sale.status === "COMPLETED" ? "green" : "white"}>
              {sale.status}
            </Badge>
          </span>
          <span>{sale.grandTotal}</span>
          <span>{sale.customer?.name || "Walk-in Customer"}</span>
          <span>{sale.customer?.phone || "N/A"}</span>
          <span className="text-right">
            <Badge variant={sale.paymentMethod === "CASH" ? "yellow" : "blue"}>
              {sale.paymentMethod}
            </Badge>
          </span>
        </div>
      </div>

      {/* REASON FIELD */}
      <div className="mt-4 flex flex-col gap-1">
        <label className="text-[#71717A] text-[14px] font-medium">
          Reason for Return <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full h-24 p-3 rounded-lg bg-[#F1F5F9] resize-none outline-none"
          placeholder="Enter reason..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </CenteredModal>
  );
};

export default ReturnForm;