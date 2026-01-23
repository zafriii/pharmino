"use client";

import React from "react";
import CenteredModal from "@/components/shared ui/CenteredModal";
import Badge from "@/components/shared ui/Badge";
import { Payment } from "@/types/payment.types";

interface SinglePaymentProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment;
}

export default function SinglePayment({ isOpen, onClose, payment }: SinglePaymentProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (numAmount === null || numAmount === undefined || isNaN(numAmount)) {
      return '$0.00';
    }
    return `$${numAmount.toFixed(2)}`;
  };

  const remainingAmount = payment.amount - (payment.refundedAmount || 0);

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payment Details - # ${payment.id}`}
      width="w-full max-w-3xl"
    >
      <div className="space-y-6">
        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Payment Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Payment ID</p>
              <p className="font-medium">#{payment.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sale ID</p>
              <p className="font-medium text-blue-600">#{payment.saleId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge
                variant={
                  payment.status === "PAID"
                    ? "green"
                    : payment.status === "REFUNDED"
                    ? "red"
                    : "yellow"
                }
              >
                {payment.status.replace("_", " ")}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-medium">{payment.method}</p>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        {payment.sale?.customer && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{payment.sale.customer.name}</p>
              </div>
              {payment.sale.customer.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{payment.sale.customer.phone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Amount Details */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Amount Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Original Amount:</span>
              <span className="font-medium">{(payment.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Refunded Amount:</span>
              <span className="font-medium text-red-600">
                {payment.refundedAmount ? (payment.refundedAmount) : '$0.00'}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold text-lg">Remaining Amount:</span>
              <span className="font-bold text-lg text-green-600">
                {(remainingAmount.toFixed(2))}
              </span>
            </div>
          </div>
        </div>

        {/* Refund Information */}
        {payment.refundedAmount && payment.refundedAmount > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold text-lg mb-3 text-yellow-800">Refund Information</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-yellow-600">Refund Method:</p>
                  <p className="font-medium text-yellow-800">{payment.refundMethod || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-yellow-600">Refund Date:</p>
                  <p className="font-medium text-yellow-800">
                    {payment.refundedAt ? formatDate(payment.refundedAt) : 'N/A'}
                  </p>
                </div>
              </div>
              {payment.refundReason && (
                <div>
                  <p className="text-sm text-yellow-600">Refund Reason:</p>
                  <p className="font-medium text-yellow-800 bg-white p-2 rounded border">
                    {payment.refundReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sale Return Information */}
        {payment.sale?.returnReason && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-lg mb-3 text-red-800">Sale Return Information</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-red-600">Sale Status:</p>
                <p className="font-medium text-red-800">{payment.sale.status}</p>
              </div>
              <div>
                <p className="text-sm text-red-600">Return Reason:</p>
                <p className="font-medium text-red-800 bg-white p-2 rounded border">
                  {payment.sale.returnReason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Details */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Transaction Details</h3>
          <div className="space-y-3">
            {payment.transactionReference && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction Reference:</span>
                <span className="font-medium">{payment.transactionReference}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Date:</span>
              <span className="font-medium">{formatDate(payment.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium">{formatDate(payment.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Cashier Information */}
        {payment.sale?.creator && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Cashier Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{payment.sale.creator.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{payment.sale.creator.email}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </CenteredModal>
  );
}