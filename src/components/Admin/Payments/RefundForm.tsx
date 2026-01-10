"use client";

import React, { useState, useTransition } from "react";
import CenteredModal from "@/components/shared ui/CenteredModal";
import Button from "@/components/shared ui/Button";
import Badge from "@/components/shared ui/Badge";
import CustomSelector from "@/components/shared ui/CustomSelector";
import { Payment } from "@/types/payment.types";
import { refundPaymentAction } from "@/actions/payment.actions";

interface RefundFormProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
  onSuccess?: () => void;
}

const RefundForm: React.FC<RefundFormProps> = ({
  isOpen,
  onClose,
  payment,
  onSuccess,
}) => {
  const [refundAmount, setRefundAmount] = useState("");
  const [refundMethod, setRefundMethod] = useState<"CASH" | "CARD">("CASH");
  const [refundReason, setRefundReason] = useState("");
  const [isPending, startTransition] = useTransition();

  // Auto-populate refund reason from sale return reason
  React.useEffect(() => {
    if (isOpen && payment.sale?.returnReason && !refundReason) {
      setRefundReason(payment.sale.returnReason);
    }
  }, [isOpen, payment.sale?.returnReason, refundReason]);

  const remainingAmount = Number(payment.amount) - Number(payment.refundedAmount || 0);
  const maxRefundAmount = Number(remainingAmount.toFixed(2));

  const refundMethodOptions = [
    { value: "CASH", label: "Cash" },
    { value: "CARD", label: "Card" },
  ];

  const handleRefund = async () => {
    const amount = parseFloat(refundAmount);
    
    if (!refundAmount.trim() || amount <= 0) {
      alert("Please enter a valid refund amount.");
      return;
    }

    if (amount > maxRefundAmount) {
      alert(`Refund amount cannot exceed $${maxRefundAmount.toFixed(2)}`);
      return;
    }

    if (!refundReason.trim()) {
      alert("Please provide a refund reason.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await refundPaymentAction({
          paymentId: payment.id,
          refundAmount: amount,
          refundMethod,
          refundReason,
        });
        
        if (result.success) {
          onClose();
          setRefundAmount("");
          setRefundReason("");
          setRefundMethod("CASH");
          
          if (onSuccess) onSuccess();
        } else {
          alert(result.error || result.message);
        }
      } catch (error: any) {
        alert(error.message || "Failed to process refund.");
      }
    });
  };

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Refund"
      width="w-full max-w-lg"
      footerButtons={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleRefund} disabled={isPending}>
            {isPending ? "Processing..." : "Process Refund"}
          </Button>
        </>
      }
    >
      {/* PAYMENT INFO */}
      <div className="border border-[#E5E5E5] rounded-lg p-3 grid grid-cols-2 text-sm">
        <div className="flex flex-col gap-2 font-medium text-gray-700">
          <span>Payment ID:</span>
          <span>Sale ID:</span>
          <span>Original Amount:</span>
          <span>Already Refunded:</span>
          <span>Available for Refund:</span>
          <span>Customer:</span>
          <span>Payment Method:</span>
          <span>Status:</span>
        </div>
        <div className="flex flex-col gap-2 text-gray-900 items-end">
          <span># {payment.id}</span>
          <span># {payment.saleId}</span>
          <span>${Number(payment.amount).toFixed(2)}</span>
          <span>${Number(payment.refundedAmount || 0).toFixed(2)}</span>
          <span className="font-semibold text-green-600">${remainingAmount.toFixed(2)}</span>
          <span>{payment.sale?.customer?.name || "Walk-in Customer"}</span>
          <span>
            <Badge variant={payment.method === "CASH" ? "yellow" : "blue"}>
              {payment.method}
            </Badge>
          </span>
          <span>
            <Badge variant={
              payment.status === "PAID" ? "green" : 
              payment.status === "REFUNDED" ? "red" : "yellow"
            }>
              {payment.status.replace("_", " ")}
            </Badge>
          </span>
        </div>
      </div>

      {/* REFUND AMOUNT FIELD */}
      <div className="mt-4 flex flex-col gap-1">
        <label className="text-[#71717A] text-[14px] font-medium">
          Refund Amount <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max={maxRefundAmount}
          className="w-full p-3 rounded-lg bg-[#F1F5F9] outline-none"
          placeholder={`Enter amount (Max: $${maxRefundAmount.toFixed(2)})`}
          value={refundAmount}
          onChange={(e) => setRefundAmount(e.target.value)}
        />
      </div>

      {/* REFUND METHOD SELECTOR */}
      <div className="mt-4 flex flex-col gap-1">
        <label className="text-[#71717A] text-[14px] font-medium">
          Refund Method <span className="text-red-500">*</span>
        </label>
        <CustomSelector
          options={refundMethodOptions}
          value={refundMethod}
          onChange={(e) => setRefundMethod(e.target.value as "CASH" | "CARD")}
        />
      </div>

      {/* REFUND REASON FIELD */}
      <div className="mt-4 flex flex-col gap-1">
        <label className="text-[#71717A] text-[14px] font-medium">
          Refund Reason <span className="text-red-500">*</span>
        </label>
        <textarea
          className="w-full h-24 p-3 rounded-lg bg-[#F1F5F9] resize-none outline-none"
          placeholder="Enter refund reason..."
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
        />
      </div>

      {/* Show return reason from sale if available */}
      {payment.sale?.returnReason && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm font-medium text-yellow-800 mb-1">
            Sale Return Reason:
          </div>
          <div className="text-sm text-yellow-700">
            {payment.sale.returnReason}
          </div>
        </div>
      )}
    </CenteredModal>
  );
};

export default RefundForm;