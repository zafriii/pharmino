import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
import ReceivedProductAction from "./ReceivedProductAction";
import ReceivedProductsPagination from "./ReceivedProductsPagination";
import { ReceivedItem } from "@/types/receivedProducts.types";


interface ReceivedProductsListProps {
  receivedItems: ReceivedItem[];
  totalPages: number;
  currentPage: number;
}

export default function ReceivedProductsList({
  receivedItems,
  totalPages,
  currentPage,
}: ReceivedProductsListProps) {
  const getStatusVariant = (isFullyProcessed: boolean, canAddToInventory: boolean, remainingQuantity: number) => {
    if (isFullyProcessed || remainingQuantity <= 0) return 'green';
    if (canAddToInventory && remainingQuantity > 0) return 'yellow';
    return 'white';
  };

  const getStatusText = (isFullyProcessed: boolean, canAddToInventory: boolean, remainingQuantity: number) => {
    if (isFullyProcessed || remainingQuantity <= 0) return 'Added to Inventory';
    if (canAddToInventory && remainingQuantity > 0) return 'Ready for Inventory';
    return 'Processing';
  };

  const columns: TableColumn[] = [
    {
      key: "product",
      header: "Product",
      render: (row: ReceivedItem) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#C0C0C0] overflow-hidden flex items-center justify-center">
            {row.purchaseItem.item.imageUrl ? (
              <img
                src={row.purchaseItem.item.imageUrl}
                alt={row.purchaseItem.item.itemName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-gray-600">
                {row.purchaseItem.item.itemName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <span className="font-medium block">
              {row.purchaseItem.item.itemName}
            </span>

            {row.purchaseItem.item.genericName && (
              <span className="text-xs text-gray-500 block">
                Generic: {row.purchaseItem.item.genericName}
              </span>
            )}

            {row.purchaseItem.item.brand && (
              <span className="text-xs text-gray-500 block">
                Brand: {row.purchaseItem.item.brand}
              </span>
            )}
          </div>
        </div>
      ),
    },

    {
      key: "category",
      header: "Category",
      render: (row: ReceivedItem) => (
        <Badge variant="white">{row.purchaseItem.item.category?.name || "N/A"}</Badge>
      ),
    },

    {
      key: "purchaseOrder",
      header: "Purchase Order",
      render: (row: ReceivedItem) => (
        <div className="space-y-1">
          <span className="font-medium block">PO: {row.purchaseItem.purchaseOrder.id}</span>
          <span className="text-xs text-gray-500">
            Total: {(row.purchaseItem.purchaseOrder.totalAmount)}
          </span>
        </div>
      ),
    },

    {
      key: "supplier",
      header: "Supplier",
      render: (row: ReceivedItem) => (
        <span className="text-sm">{row.purchaseItem.supplier}</span>
      ),
    },

    {
      key: "quantities",
      header: "Quantities",
      render: (row: ReceivedItem) => (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-green-600">Received: </span>
            <span className="font-medium text-green-600">{row.receivedQuantity}</span>
          </div>
          <div className="text-sm">
            <span className="text-blue-400">Remaining: </span>
            <span className="font-medium text-blue-400">{row.remainingQuantity}</span>
          </div>
        </div>
      ),
    },

    {
      key: "prices",
      header: "Prices",
      render: (row: ReceivedItem) => (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-red-500">Purchase: </span>
            <span className="font-medium text-red-500">{(row.purchaseItem.puchasePrice)}</span>
          </div>
          <div className="text-sm">
            <span className="text-green-600">Selling: </span>
            <span className="font-medium text-green-600">{(row.purchaseItem.item.sellingPrice || 0)}</span>
          </div>
        </div>
      ),
    },

    {
      key: "receivedAt",
      header: "Received Date",
      render: (row: ReceivedItem) => (
        // <span className="text-sm text-gray-500">
        //   {new Date(row.receivedAt).toLocaleDateString()}
        // </span>
         <LocalDate date={row.receivedAt} />
      ),
    },

    {
      key: "status",
      header: "Status",
      render: (row: ReceivedItem) => (
        <Badge variant={getStatusVariant(row.isFullyProcessed, row.canAddToInventory, row.remainingQuantity)}>
          {getStatusText(row.isFullyProcessed, row.canAddToInventory, row.remainingQuantity)}
        </Badge>
      ),
    },

    {
      key: "action",
      header: "Action",
      render: (row: ReceivedItem) => (
        <ReceivedProductAction receivedItem={row} />
      ),
    },
  ];

  return (
    <div className="w-full">
      <ReusableTable columns={columns} data={receivedItems} />

      <div className="mt-4 flex justify-end">
        <ReceivedProductsPagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}