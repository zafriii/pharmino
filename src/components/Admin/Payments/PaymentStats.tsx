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
  
  // Calculate total revenue: PAID (full amount) + PARTIALLY_REFUNDED (remaining amount)
  const totalRevenue = payments.reduce((sum, payment) => {
    if (payment.status === "PAID") {
      return sum + (Number(payment.amount) || 0);
    } else if (payment.status === "PARTIALLY_REFUNDED") {
      const remainingAmount = (Number(payment.amount) || 0) - (Number(payment.refundedAmount) || 0);
      return sum + remainingAmount;
    }
    return sum; // REFUNDED payments contribute 0 to revenue
  }, 0);

  // Calculate total refunded amount only from REFUNDED status payments
  const totalRefunded = payments
    .filter((p) => p.status === "REFUNDED")
    .reduce((sum, payment) => sum + (Number(payment.refundedAmount) || 0), 0);

  // Calculate partial refunds amount from PARTIALLY_REFUNDED status payments
  const totalPartialRefunds = payments
    .filter((p) => p.status === "PARTIALLY_REFUNDED")
    .reduce((sum, payment) => sum + (Number(payment.refundedAmount) || 0), 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4 mt-6">
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
        title="Total Revenue"
        value={`${Number(totalRevenue).toFixed(2)}`}
        variant="green"
      />

      <StatsCard
        title="Total Refunded"
        value={`${Number(totalRefunded).toFixed(2)}`}
        variant="red"
      />

      <StatsCard
        title="Partial Refunds"
        value={`${Number(totalPartialRefunds).toFixed(2)}`}
        variant="yellow"
      />
    </div>
  );
};

export default PaymentStats;