import React from "react";
import { cookies } from "next/headers";
import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
import Button from "@/components/shared ui/Button";
import { ProductBatch } from "@/types/inventory.types";
import Link from "next/link";
import { GoArrowLeft } from "react-icons/go";
import BatchStats from "./BatchStats";
import RecordDamageButton from "../Damage Record/RecordDamageButton";
import BatchDamageDetails from "./BatchDamageDetails";
import BatchListAction from "./BatchListAction";
import BatchWrapper from "./BatchWrapper";
import LocalDate from "@/components/shared ui/LocalDate";

interface BatchListProps {
  itemId: string;
  searchParams?: {
    status?: string;
  };
}

async function fetchBatches(itemId: string, status?: string) {
  try {
    const cookieStore = await cookies();
    // const sessionToken = cookieStore.get("better-auth.session_token")?.value;
    const cookieHeader = cookieStore.toString();

    // Build URL with status parameter if provided
    const url = new URL(`${process.env.BETTER_AUTH_URL}/api/admin/inventory/${itemId}/batches`);
    if (status && status !== '') {
      url.searchParams.set('status', status);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      next: {
        revalidate: 60,
        tags: ["batches", `item-${itemId}`],
      },
      headers: {
        "Content-Type": "application/json",
        // ...(sessionToken
        //   ? { Cookie: `better-auth.session_token=${sessionToken}` }
        //   : {}),
        Cookie:cookieHeader
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch batches: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Fetch Batches Error:", error);
    return {
      item: null,
      batches: { all: [] },
      summary: {
        totalStock: 0,
        totalDamageQuantity: 0,
        activeBatchesCount: 0,
        inactiveBatchesCount: 0,
        soldOutBatchesCount: 0,
        expiredBatchesCount: 0,
      },
    };
  }
}

export default async function BatchList({ itemId, searchParams }: BatchListProps) {
  const data = await fetchBatches(itemId, searchParams?.status);

  const item = data?.item || null;
  const batches = data?.batches || { all: [] };
  const summary = data?.summary || {
    totalStock: 0,
    totalDamageQuantity: 0,
    activeBatchesCount: 0,
    inactiveBatchesCount: 0,
    soldOutBatchesCount: 0,
    expiredBatchesCount: 0,
  };

  if (!item) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Item not found</p>
        <Link href="/admin/inventory">
          <Button variant="secondary" leftIcon={<GoArrowLeft />}>
            Back to Inventory
          </Button>
        </Link>
      </div>
    );
  }

  const tabletsPerStrip = item.tabletsPerStrip || 0;

  const getBatchStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "green";
      case "INACTIVE":
        return "yellow";
      case "SOLD_OUT":
      case "EXPIRED":
        return "red";
      default:
        return "white";
    }
  };

  const columns: TableColumn[] = [
    {
      key: "batchNumber",
      header: "Batch Number",
      render: (row: ProductBatch) => (
        <span className="font-medium">{row.batchNumber}</span>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      render: (row: ProductBatch) => {
        if (tabletsPerStrip > 0) {
          // For tablet products, show tablets including remainingTablets
          const completeStripTablets = row.quantity * tabletsPerStrip;
          const partialTablets = row.remainingTablets || 0;
          const totalTablets = completeStripTablets + partialTablets;
          
          return (
            <div className="text-sm">
              <span className="font-medium">
                {totalTablets} tablets
              </span>
              {row.quantity > 0 && (
                <span className="text-gray-500">
                  {" "}({row.quantity} strips
                  {partialTablets > 0 && ` + ${partialTablets} tablets`})
                </span>
              )}
              {partialTablets > 0 && row.quantity === 0 && (
                <span className="text-gray-500"> (partial strip)</span>
              )}
            </div>
          );
        } else {
          // For non-tablet products, show regular units
          return (
            <div className="text-sm">
              <span className="font-medium">
                {row.quantity} {row.quantity > 1 ? "units" : "unit"}
              </span>
            </div>
          );
        }
      },
    },
    {
      key: "damageQuantity",
      header: "Damage Qty",
      render: (row: ProductBatch) => (
        <div className="text-sm">
          <BatchDamageDetails 
            batchId={row.id}
            batchNumber={row.batchNumber}
            damageQuantity={row.damageQuantity || 0}
          />
          
        </div>
      ),
    },    
    {
      key: "prices",
      header: "Prices",
      render: (row: ProductBatch) => (
        <div className="space-y-1 text-sm">
          <div>
            <span className="text-gray-600">Purchase: </span>
            <span className="font-medium">{row.purchasePrice}</span>
          </div>
          <div>
            <span className="text-gray-600">Selling: </span>
            <span className="font-medium">{row.sellingPrice}</span>
          </div>
        </div>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      render: (row: ProductBatch) => (
        <span className="text-sm">{row.supplier}</span>
      ),
    },
    {
      key: "expiryDate",
      header: "Expiry Date",
      render: (row: ProductBatch) => (
        <span className="text-sm">
          {row.expiryDate
            ? new Date(row.expiryDate).toLocaleDateString()
            : "No expiry"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: ProductBatch) => (
        <Badge variant={getBatchStatusVariant(row.status)}>
          {row.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Batch Created",
      render: (row: ProductBatch) => <LocalDate date={row.createdAt} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: ProductBatch) => {
        // Don't show actions for expired or sold out batches
        if (row.status === "EXPIRED" || row.status === "SOLD_OUT") {
          return null;
        }
        return <BatchListAction batch={row} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center w-full gap-3">
  
        {/* Back to Inventory */}
        <Link
          href="/admin/inventory"
          className="text-[#4a90e2] flex items-center gap-1 w-fit"
        >
          <GoArrowLeft className="text-lg" />
          <span className="text-sm md:text-base">Back to Inventory</span>
        </Link>

        {/* Right side buttons & stats */}
        <div className="flex items-center gap-2 flex-wrap">
          
          <RecordDamageButton
            itemId={parseInt(itemId)}
            itemName={item.itemName}
            batches={batches.all}
          />

          <BatchStats summary={summary} />

        </div>
      </div>


      {/* Item Details */}
      <h1 className="text-2xl font-bold">{item.itemName}</h1>
      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
        {item.brand && <span>Brand: {item.brand}</span>}
        {item.genericName && <span>Generic: {item.genericName}</span>}
        {item.category?.name && <span>Category: {item.category.name}</span>}
        {tabletsPerStrip > 0 && <span>Tablets per strip: {tabletsPerStrip}</span>}
      </div>

      {/* Batch Stats */}
      {/* <BatchStats summary={summary} /> */}

      {/* Batches Table */}
      <div className="p-0">
        <h2 className="text-lg font-semibold mb-4">
          {searchParams?.status 
            ? `${searchParams.status.replace('_', ' ')} Batches` 
            : 'All Batches'
          }
        </h2>
        {batches.all.length > 0 ? (
          <ReusableTable columns={columns} data={batches.all} />
        ) : (
          <div className="text-center py-8 text-gray-500">
            {searchParams?.status 
              ? `No ${searchParams.status.toLowerCase().replace('_', ' ')} batches found for this item`
              : 'No batches found for this item'
            }
          </div>
        )}
      </div>
    </div>
  );
}









