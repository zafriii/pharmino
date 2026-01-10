import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
import PurchaseAction from "./PurchaseAction";
import PurchasePagination from "../PurchasePagination";
import { formatCurrency } from "@/lib/utils";
import { PurchaseOrder } from "@/types/purchase.types";

interface PurchaseListProps {
  purchases: PurchaseOrder[];
  totalPages: number;
  currentPage: number;
}

export default function PurchaseList({ purchases, totalPages, currentPage }: PurchaseListProps) {
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
        <div className="space-y-2">
          {row.items.slice(0, 2).map((item) => (
            <div key={item.id} className="text-sm space-y-1">
              <div>
                <span className="font-medium">{item.item.itemName}</span>
                {item.item.brand && (
                  <span className="text-gray-500 ml-1">({item.item.brand})</span>
                )}
              </div>
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
        <div className="font-medium">{(row.totalAmount)}</div>
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
      header: "Created",
      render: (row: PurchaseOrder) => (
        // <div className="text-sm text-gray-600">
        //   {new Date(row.createdAt).toLocaleDateString()}
        // </div>
        <div className="text-sm">
          <span className="block">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
          <span className="text-gray-500 text-xs">
            {new Date(row.createdAt).toLocaleTimeString()}
          </span>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (row: PurchaseOrder) => <PurchaseAction purchase={row} />,
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
