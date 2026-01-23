"use client";

import React from "react";
import CenteredModal from "@/components/shared ui/CenteredModal";
import Badge from "@/components/shared ui/Badge";
import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import { Sale, SaleItem } from "@/types/sale.types";

interface SingleOrderProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
}

export default function SingleOrder({ isOpen, onClose, sale }: SingleOrderProps) {
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

  const itemColumns: TableColumn[] = [
    {
      key: "item",
      header: "Item",
      render: (row: SaleItem) => (
        <div className="flex items-center">
          {row.item?.imageUrl && (
            <img 
              src={row.item.imageUrl} 
              alt={row.item.itemName}
              className="w-10 h-10 rounded-md object-cover mr-3"
            />
          )}
          <div>
            <p className="font-medium text-gray-900">{row.item?.itemName}</p>
            <p className="text-sm text-gray-500">{row.item?.baseUnit}</p>
          </div>
        </div>
      ),
    },
    {
      key: "brand",
      header: "Brand",
      render: (row: SaleItem) => (
        <span className="text-sm text-gray-900">
          {row.item?.brand || '-'}
        </span>
      ),
    },
    // {
    //   key: "strength",
    //   header: "Strength",
    //   render: (row: SaleItem) => (
    //     <span className="text-sm text-gray-900">
    //       {row.item?.strength || '-'}
    //     </span>
    //   ),
    // },
    // {
    //   key: "sellType",
    //   header: "Sell Type",
    //   render: (row: SaleItem) => (
    //     <span className="text-sm text-gray-900">
    //       {row.sellType || '-'}
    //     </span>
    //   ),
    // },
    {
      key: "quantity",
      header: "Quantity",
      render: (row: SaleItem) => (
        <span className="text-sm text-gray-900">
          {row.quantity}
        </span>
      ),
    },
    {
      key: "batches",
      header: "Batches",
      render: (row: SaleItem) => (
        <div className="text-sm text-gray-900">
          {row.batches && row.batches.length > 0 ? (
            <div className="space-y-1">
              {row.batches.map((saleBatch, batchIndex) => (
                <div key={batchIndex} className="bg-blue-50 px-2 py-1 rounded text-xs">
                  <div className="font-medium text-blue-800">
                    {saleBatch.batch.batchNumber}
                  </div>
                  <div className="text-gray-600">
                    Qty: {saleBatch.quantity}
                  </div>
                  {saleBatch.batch.expiryDate && (
                    <div className="text-gray-500">
                      Exp: {new Date(saleBatch.batch.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">No batch info</span>
          )}
        </div>
      ),
    },
    {
      key: "unitPrice",
      header: "Unit Price",
      render: (row: SaleItem) => (
        <span className="text-sm text-gray-900">
          {(row.unitPrice || 0)}
        </span>
      ),
    },
    {
      key: "totalPrice",
      header: "Total",
      render: (row: SaleItem) => (
        <span className="text-sm font-medium text-gray-900">
          {(row.totalPrice || 0)}
        </span>
      ),
    },
  ];

  return (
    <CenteredModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order Details - # ${sale.id}`}
      width="w-full max-w-4xl"
    >
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Order Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-medium">#{sale.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge
                variant={
                  sale.status === "COMPLETED"
                    ? "green"
                    : "red"
                }
              >
                {sale.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-medium">{sale.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Status</p>
              <Badge
                variant={
                  sale.paymentStatus === "PAID"
                    ? "green"
                    : "red"
                }
              >
                {sale.paymentStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        {sale.customer && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{sale.customer.name}</p>
              </div>
              {sale.customer.phone && (
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{sale.customer.phone}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white border rounded-lg">
          <h3 className="font-semibold text-lg p-4 border-b">Order Items</h3>
          <ReusableTable columns={itemColumns} data={sale.saleItems} />
        </div>

        {/* Pricing Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-3">Pricing Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{(sale.subtotal || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Discount:</span>
              <span className="font-medium text-red-600">-{(sale.discountAmount || 0)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-semibold text-lg">Grand Total:</span>
              <span className="font-bold text-lg text-green-600">{(sale.grandTotal || 0)}</span>
            </div>
          </div>
        </div>

        {/* Return Information */}
        {sale.status === 'RETURNED' && sale.returnReason && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold text-lg mb-3 text-red-800">Return Information</h3>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-red-600">Return Reason:</p>
                <p className="font-medium text-red-800">{sale.returnReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Timeline */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">Order Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <p className="font-medium">Order Created</p>
                <p className="text-sm text-gray-600">{formatDate(sale.createdAt)}</p>
                {/* {sale.creator && (
                  <p className="text-sm text-gray-500">by {sale.creator.name}</p>
                )} */}
              </div>
            </div>
            {sale.status === 'RETURNED' && (
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium">Order Returned</p>
                  <p className="text-sm text-gray-600">{formatDate(sale.updatedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CenteredModal>
  );
}