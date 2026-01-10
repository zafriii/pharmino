export interface Payment {
  id: number;
  saleId: number;
  amount: number;
  method: "CASH" | "CARD";
  status: "PAID" | "REFUNDED" | "PARTIALLY_REFUNDED";
  transactionReference?: string | null;
  refundReason?: string | null;
  refundMethod?: "CASH" | "CARD" | null;
  refundedAmount?: number | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sale?: {
    id: number;
    grandTotal: number;
    paymentMethod: "CASH" | "CARD";
    paymentStatus: "PAID" | "REFUNDED" | "PARTIALLY_REFUNDED";
    status: "COMPLETED" | "RETURNED";
    returnReason?: string | null;
    customer?: {
      id: number;
      name: string;
      phone?: string | null;
    } | null;
    creator?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface CreatePaymentRequest {
  saleId: number;
  amount: number;
  method: "CASH" | "CARD";
  transactionReference?: string;
}

export interface RefundPaymentRequest {
  paymentId: number;
  refundAmount: number;
  refundMethod: "CASH" | "CARD";
  refundReason: string;
}

export interface PaymentFilters {
  search?: string;
  status?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
}