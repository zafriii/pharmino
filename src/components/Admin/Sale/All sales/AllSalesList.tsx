import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
import SalePagination from "./SalePagination";
import SaleAction from "./SaleAction";
import { Sale } from "@/types/sale.types";
import { HiOutlineCreditCard, HiOutlineBanknotes } from "react-icons/hi2";

interface AllSalesListProps {
  sales: Sale[];
  totalPages: number;
  currentPage: number;
}

export default function AllSalesList({
  sales,
  totalPages,
  currentPage,
}: AllSalesListProps) {
  const columns: TableColumn[] = [
    {
      key: "id",
      header: "Sale ID",
      render: (row: Sale) => (
        <span className="font-medium text-gray-900">
          #{row.id}
        </span>
      ),
    },

    {
      key: "customer",
      header: "Customer",
      render: (row: Sale) => (
        <span className="text-gray-700">
          {row.customer?.name || "Walk-in Customer"}
        </span>
      ),
    },

    {
      key: "creator",
      header: "Cashier",
      render: (row: Sale) => (
        <span className="text-gray-700">
          {row.creator?.name || "Unknown"}
        </span>
      ),
    },

    {
      key: "itemCount",
      header: "Items",
      render: (row: Sale) => (
        <div className="text-gray-600 text-sm">
          {row.saleItems && row.saleItems.length > 0 ? (
            <div className="space-y-2">
              {row.saleItems.slice(0, 2).map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {item.item?.itemName || `Item ${item.itemId}`}
                    </span>
                    <span className="text-gray-500">x {item.quantity}</span>
                  </div>
                  {item.batches && item.batches.length > 0 && (
                    <div className="ml-0 space-y-1">
                      {item.batches.map((saleBatch, batchIndex) => (
                        <div key={batchIndex} className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded ml--4">
                          <span className="font-medium">Batch: {saleBatch.batch.batchNumber}</span>
                          <span className="ml-2">
                            Qty: {saleBatch.quantity === 0 
                              ? `${item.item?.itemName || 'Item'} x ${item.quantity} (${item.sellType === 'SINGLE_TABLET' ? 'Tablets' : 'Units'})`
                              : saleBatch.quantity
                            }
                          </span>
                          {saleBatch.batch.expiryDate && (
                            <span className="ml-2 text-gray-500">
                              Exp: {new Date(saleBatch.batch.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {row.saleItems.length > 2 && (
                <div className="text-gray-400 text-xs">
                  +{row.saleItems.length - 2} more items
                </div>
              )}
            </div>
          ) : (
            <span>No items</span>
          )}
        </div>
      ),
    },

    {
      key: "grandTotal",
      header: "Total Amount",
      render: (row: Sale) => (
        <span className="font-semibold text-gray-900">
          {Number(row.grandTotal || 0).toFixed(2)}
        </span>
      ),
    },

    {
      key: "paymentMethod",
      header: "Payment Method",
      render: (row: Sale) => (
        <span className="flex items-center gap-1 text-xs font-medium">
          {row.paymentMethod === "CASH" ? (
            <HiOutlineBanknotes className="w-4 h-4" />
          ) : (
            <HiOutlineCreditCard className="w-4 h-4" />
          )}
          {row.paymentMethod}
        </span>
      ),
    },

    {
      key: "paymentStatus",
      header: "Payment Status",
      render: (row: Sale) => (
        <Badge
          variant={
            row.paymentStatus === "PAID"
              ? "green"
              : "red"
          }
        >
          {row.paymentStatus}
        </Badge>
      ),
    },

    {
      key: "status",
      header: "Status",
      render: (row: Sale) => (
        <Badge
          variant={
            row.status === "COMPLETED"
              ? "green"
              : "red"
          }
        >
          {row.status}
        </Badge>
      ),
    },

    {
      key: "createdAt",
      header: "Sale Date",
      render: (row: Sale) =>
        new Date(row.createdAt).toLocaleDateString("en-US", {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
    },

    {
      key: "discountAmount",
      header: "Discount",
      render: (row: Sale) => (
        <span className="text-gray-600">
          {Number(row.discountAmount || 0) > 0 ? `${Number(row.discountAmount || 0).toFixed(2)}` : "-"}
        </span>
      ),
    },

    {
      key: "action",
      header: "Action",
      render: (row: Sale) => <SaleAction sale={row} />,
    },
  ];

  return (
    <div className="w-full">
      <ReusableTable columns={columns} data={sales} />

      <div className="mt-4 flex justify-end">
        <SalePagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}