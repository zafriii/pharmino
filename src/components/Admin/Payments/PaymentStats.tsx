import React from "react";
import StatsCard from "@/components/shared ui/StatsCard";
import type { Payment } from "@/types/payment.types";

interface PaymentStatsProps {
  payments: Payment[];
}

const PaymentStats: React.FC<PaymentStatsProps> = ({ payments = [] }) => {
  const total = payments.length;
  const paid = payments.filter((p) => p.status === "PAID").length;
  const refunded = payments.filter((p) => p.status === "REFUNDED").length;
  const partiallyRefunded = payments.filter((p) => p.status === "PARTIALLY_REFUNDED").length;
  
  const totalAmount = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const totalRefunded = payments.reduce((sum, payment) => sum + (Number(payment.refundedAmount) || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
      <StatsCard
        title="Total Payments"
        value={total.toString()}
        variant="blue"
      />

      <StatsCard
        title="Paid"
        value={paid.toString()}
        variant="green"
      />

      <StatsCard
        title="Partially Refunded"
        value={partiallyRefunded.toString()}
        variant="yellow"
      />

      <StatsCard
        title="Refunded"
        value={refunded.toString()}
        variant="red"
      />

      <StatsCard
        title="Total Amount"
        value={`${Number(totalAmount).toFixed(2)}`}
        variant="green"
      />

      <StatsCard
        title="Total Refunded"
        value={`${Number(totalRefunded).toFixed(2)}`}
        variant="red"
      />
    </div>
  );
};

export default PaymentStats;