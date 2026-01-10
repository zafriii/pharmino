import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
import PurchaseHistoryAction from "./PurchaseHistoryAction";
import PurchasePagination from "../PurchasePagination";
import { PurchaseOrder } from "@/types/purchase.types";

interface PurchaseHistoryListProps {
  purchases: PurchaseOrder[];
  totalPages: number;
  currentPage: number;
  tab: 'ordered' | 'received';
}

export default function PurchaseHistoryList({ 
  purchases, 
  totalPages, 
  currentPage, 
  tab 
}: PurchaseHistoryListProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'LISTED':
        return 'blue';
      case 'ORDERED':
        return 'yellow';
      case 'RECEIVED':
        return 'green';
      default:
        return 'white';
    }
  };

  const columns: TableColumn[] = [
    {
      key: "id",
      header: "PO ID",
      render: (row: PurchaseOrder) => (
        <div className="font-medium text-sm">
          #{row.id.slice(-8).toUpperCase()}
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (row: PurchaseOrder) => (
        <div className="space-y-1">
          {row.items.slice(0, 2).map((item, index) => (
            <div key={item.id} className="text-sm">
              <span className="font-medium">{item.item.itemName}</span>
              {item.item.brand && (
                <span className="text-gray-500 ml-1">({item.item.brand})</span>
              )}
              <div className="text-xs text-gray-500">
                Qty: {item.quantity} | Supplier: {item.supplier}
              </div>
              <div className="text-xs text-red-500 font-medium mt-1">
                Purchase Price: {(item.puchasePrice)}
              </div>
            </div>
          ))}
          {row.items.length > 2 && (
            <div className="text-xs text-gray-500">
              +{row.items.length - 2} more items
            </div>
          )}
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Total Amount",
      render: (row: PurchaseOrder) => (
        <div className="font-medium">
          {/* {formatCurrency(parseFloat(row.totalAmount.toString()))} */}
          { row.totalAmount.toString()}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: PurchaseOrder) => (
        <Badge variant={getStatusVariant(row.status)}>
          {row.status.charAt(0) + row.status.slice(1).toLowerCase()}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: tab === 'ordered' ? "Ordered Date" : "Received Date",
      render: (row: PurchaseOrder) => (
        // <div className="text-sm text-gray-600">
        //   {new Date(row.updatedAt).toLocaleDateString()}
        // </div>
        <div className="text-sm">
          <span className="block">
            {new Date(row.updatedAt).toLocaleDateString()}
          </span>
          <span className="text-gray-500 text-xs">
            {new Date(row.updatedAt).toLocaleTimeString()}
          </span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row: PurchaseOrder) => (
        <PurchaseHistoryAction purchase={row} tab={tab} />
        
      ),
    },
  ];

  return (
    <div className="w-full">
      <ReusableTable columns={columns} data={purchases} />

      <div className="mt-4 flex justify-end">
        <PurchasePagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}