import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
import InventoryPagination from "./InventoryPagination";
import { InventoryItem } from "@/types/inventory.types";
import Link from "next/link";
import { GoEye } from "react-icons/go";
import LocalDate from "@/components/shared ui/LocalDate";

interface InventoryListProps {
  inventory: InventoryItem[];
  totalPages: number;
  currentPage: number;
}

export default function InventoryList({
  inventory,
  totalPages,
  currentPage,
}: InventoryListProps) {
  // Calculate dynamic stock status based on available quantity and threshold
  const getStockStatus = (availableQuantity: number, lowStockThreshold: number) => {
    if (availableQuantity === 0) {
      return "OUT_OF_STOCK";
    } else if (availableQuantity <= lowStockThreshold) {
      return "LOW_STOCK";
    } else {
      return "IN_STOCK";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "IN_STOCK":
        return "green";
      case "LOW_STOCK":
        return "yellow";
      case "OUT_OF_STOCK":
        return "red";
      default:
        return "white";
    }
  };

  const columns: TableColumn[] = [
    {
      key: "product",
      header: "Product",
      render: (row: InventoryItem) => (
        
        <Link
          href={`/admin/inventory/${row.id}/batches`}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-[8px] bg-[#C0C0C0] overflow-hidden flex items-center justify-center">
            {row.product.imageUrl ? (
              <img
                src={row.product.imageUrl}
                alt={row.product.itemName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-gray-600">
                {row.product.itemName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <span className="font-medium group-hover:text-[#4a90e2] transition block">
              {row.product.itemName}
            </span>

            {row.product.genericName && (
              <span className="text-xs text-gray-500 block">
                Generic: {row.product.genericName}
              </span>
            )}

            {row.product.brand && (
              <span className="text-xs text-gray-500 block">
                Brand: {row.product.brand}
              </span>
            )}
          </div>
        </Link>
      ),
    },

    {
      key: "category",
      header: "Category",
      render: (row: InventoryItem) => (
        <Badge variant="white">
          {row.product.category?.name || "N/A"}
        </Badge>
      ),
    },

    // {
    //   key: "stock",
    //   header: "Stock Levels",
    //   render: (row: InventoryItem) => {
    //     const tabletsPerStrip = row.product.tabletsPerStrip || 0;
    //     const totalTablets = row.availableQuantity * tabletsPerStrip;

    //     return (
    //       <div className="space-y-1 text-sm">
    //         <div>
    //           <span className="font-medium">Total: </span>
    //           {row.totalQuantity}{" "}
    //           {row.totalQuantity > 1 ? "units" : "unit"}
    //         </div>

    //         <div>
    //           <span className="font-medium">Available: </span>
    //           {row.availableQuantity}{" "}
    //           {row.availableQuantity > 1 ? "units" : "unit"}
    //           {tabletsPerStrip > 0 && (
    //             <span className="text-gray-500">
    //               {" "}
    //               ({totalTablets} tablets)
    //             </span>
    //           )}
    //         </div>

    //         {row.reservedQuantity > 0 && (
    //           <div>
    //             <span className="font-medium">Reserved: </span>
    //             {row.reservedQuantity} units
    //           </div>
    //         )}
    //       </div>
    //     );
    //   },
    // },


  {
  key: "stock",
  header: "Stock Levels",
  render: (row: InventoryItem) => {
    const tabletsPerStrip = row.product.tabletsPerStrip || 0;

    const activeBatches =
      row.batches?.filter((b) => b.status === "ACTIVE") || [];

    const inactiveBatches =
      row.batches?.filter((b) => b.status === "INACTIVE") || [];

    const expiredBatches =
      row.batches?.filter((b) => b.status === "EXPIRED") || [];

    const soldOutBatches =
      row.batches?.filter((b) => b.status === "SOLD_OUT") || [];

    // Calculate available units and tablets including partial strips
    let availableUnits = 0;
    let remainingTablets = 0;
    
    if (tabletsPerStrip > 0) {
      // For tablet products, calculate units and remaining tablets separately
      availableUnits = activeBatches.reduce((sum, b) => sum + b.quantity, 0);
      remainingTablets = activeBatches.reduce((sum, b) => sum + (b.remainingTablets || 0), 0);
    } else {
      // For non-tablet products, use regular calculation
      availableUnits = activeBatches.reduce((sum, b) => sum + b.quantity, 0);
    }

    const inactiveUnits = inactiveBatches.reduce(
      (sum, b) => sum + b.quantity,
      0
    );

    const expiredUnits = expiredBatches.reduce(
      (sum, b) => sum + b.quantity,
      0
    );

    const soldOutUnits = soldOutBatches.reduce(
      (sum, b) => sum + b.quantity,
      0
    );

    // Total units = sum of active & inactive batches quantities (excludes expired and sold out)
    const totalUnits = availableUnits + inactiveUnits;

    // Calculate quantities sold from expired and sold out batches
    const expiredQuantity = expiredBatches.reduce((sum, b) => sum + b.quantity, 0);
    const soldQuantity = soldOutBatches.length; // Sold out batches had their quantity reduced to 0

    return (
      <div className="space-y-1 text-sm">
        <div>
          <span className="font-medium">Total Available: </span>
          {tabletsPerStrip > 0 && remainingTablets > 0 ? (
            <>
              {totalUnits} {totalUnits > 1 ? "units" : "unit"}
              <span className="text-gray-500">
                {" "}& {remainingTablets} tablets
              </span>
            </>
          ) : (
            <>
              {totalUnits} {totalUnits > 1 ? "units" : "unit"}
            </>
          )}
        </div>

        <div>
          <span className="font-medium text-green-600">Active: </span>
          {tabletsPerStrip > 0 && remainingTablets > 0 ? (
            <>
              {availableUnits} {availableUnits > 1 ? "units" : "unit"}
              <span className="text-gray-500">
                {" "}& {remainingTablets} tablets
              </span>
            </>
          ) : (
            <>
              {availableUnits} {availableUnits > 1 ? "units" : "unit"}
            </>
          )}
        </div>

        {inactiveUnits > 0 && (
          <div>
            <span className="font-medium text-yellow-600">Inactive: </span>
            {inactiveUnits} {inactiveUnits > 1 ? "units" : "unit"}
          </div>
        )}

        {row.reservedQuantity > 0 && (
          <div>
            <span className="font-medium text-blue-600">Reserved: </span>
            {row.reservedQuantity} {row.reservedQuantity > 1 ? "units" : "unit"}
          </div>
        )}

        {expiredUnits > 0 && (
          <div>
            <span className="font-medium text-red-500">Expired: </span>
            {expiredUnits} units
          </div>
        )}

        {soldOutUnits > 0 && (
          <div>
            <span className="font-medium text-gray-500">Sold Out Batches: </span>
            {soldOutBatches.length} batches
          </div>
        )}
      </div>
    );
  },
},


    {
      key: "threshold",
      header: "Low Stock Threshold",
      render: (row: InventoryItem) => (
        <span className="text-sm">{row.lowStockThreshold} units</span>
      ),
    },

    {
      key: "status",
      header: "Stock Status",
      render: (row: InventoryItem) => {
        const tabletsPerStrip = row.product.tabletsPerStrip || 0;
        const activeBatches = row.batches?.filter((b) => b.status === "ACTIVE") || [];
        
        let effectiveQuantity = 0;
        
        if (tabletsPerStrip > 0) {
          // For tablet products, calculate total tablets including remaining tablets
          const totalTablets = activeBatches.reduce((sum, b) => {
            const completeStripTablets = b.quantity * tabletsPerStrip;
            const partialTablets = b.remainingTablets || 0;
            return sum + completeStripTablets + partialTablets;
          }, 0);
          
          // Convert total tablets back to equivalent strips for threshold comparison
          effectiveQuantity = Math.floor(totalTablets / tabletsPerStrip);
          
          // If there are remaining tablets but no complete strips, still show as having some stock
          if (effectiveQuantity === 0 && totalTablets > 0) {
            effectiveQuantity = 0.1; // Small value to indicate partial stock
          }
        } else {
          // For non-tablet products, use regular quantity calculation
          effectiveQuantity = activeBatches.reduce((sum, b) => sum + b.quantity, 0);
        }
        
        // Calculate dynamic stock status based on effective quantity
        const dynamicStatus = getStockStatus(effectiveQuantity, row.lowStockThreshold);
        
        return (
          <Badge variant={getStatusVariant(dynamicStatus)}>
            {dynamicStatus.replace("_", " ")}
          </Badge>
        );
      },
    },

    {
      key: "location",
      header: "Location",
      render: (row: InventoryItem) => (
        <span className="text-sm">
          {row.product.rackLocation || "N/A"}
        </span>
      ),
    },

    {
      key: "batches",
      header: "Active Batches",
      render: (row: InventoryItem) => {
        const activeBatches =
          row.batches?.filter((b) => b.status === "ACTIVE") || [];

        return (
          <div className="space-y-1 text-xs">
            {activeBatches.length > 0 ? (
              activeBatches.slice(0, 2).map((batch) => (
                <div key={batch.id}>
                  <span className="font-medium">{batch.batchNumber}</span>
                  <span className="text-gray-500">
                    {" "}
                    ({batch.quantity} units)
                  </span>
                </div>
              ))
            ) : (
              <span className="text-gray-500">No active batches</span>
            )}

            {activeBatches.length > 2 && (
              <span className="text-gray-500">
                +{activeBatches.length - 2} more
              </span>
            )}
          </div>
        );
      },
    },

    // {
    //   key: "lastUpdated",
    //   header: "Last Updated",
    //   render: (row: InventoryItem) => (
    //     <span className="text-sm text-gray-500">
    //       {new Date(row.lastUpdated).toLocaleDateString()}
    //     </span>
    //   ),
    // },

    {
      key: "createdAt",
      header: "Added on",
      render: (row: InventoryItem) => <LocalDate date={row.lastUpdated} />,
    },

    {
      key: "action",
      header: "Action",
      render: (row: InventoryItem) => (
        <Link
          href={`/admin/inventory/${row.id}/batches`}
          className="text-[#4a90e2] flex items-center gap-1"
        >
          <GoEye /> View Batches
        </Link>
      ),
    },
  ];

  return (
    <div className="w-full">
      <ReusableTable columns={columns} data={inventory} />

      <div className="mt-4 flex justify-end">
        <InventoryPagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>      
    </div>
  );
}
