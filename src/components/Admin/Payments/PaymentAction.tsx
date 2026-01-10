"use client";

import React, { useState, useTransition } from "react";
import ViewButton from "@/components/shared ui/ViewButton";
import RefundButton from "@/components/shared ui/RefundButton";
import RefundForm from "./RefundForm";
// import SinglePayment from "./SinglePayment";
import { Payment } from "@/types/payment.types";
import SinglePayment from "./SinglePayment";

interface PaymentActionProps {
  payment: Payment;
}

export default function PaymentAction({ payment }: PaymentActionProps) {
  const [isRefundFormOpen, setIsRefundFormOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canRefund = payment.status === "PAID" || payment.status === "PARTIALLY_REFUNDED";
  const remainingAmount = payment.amount - (payment.refundedAmount || 0);

  const handleRefundClick = () => {
    if (!canRefund || remainingAmount <= 0) return;
    setIsRefundFormOpen(true);
  };

  const handleRefundSuccess = () => {
    startTransition(() => {
      // The form will handle the API call and page refresh
      // This is just for any additional logic if needed
    });
  };

  const handleView = () => {
    setIsPaymentModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <ViewButton onClick={handleView} />
        
        {canRefund && remainingAmount > 0 && (
          <RefundButton 
            ariaLabel="refund"
            onClick={handleRefundClick}
            disabled={isPending}
          />
        )}

        {payment.status === "REFUNDED" && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Fully Refunded
          </span>
        )}

        {payment.refundReason && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Has Reason
          </span>
        )}
      </div>

      <SinglePayment
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        payment={payment}
      />

      <RefundForm
        isOpen={isRefundFormOpen}
        onClose={() => setIsRefundFormOpen(false)}
        payment={payment}
        onSuccess={handleRefundSuccess}
      />
    </>
  );
}