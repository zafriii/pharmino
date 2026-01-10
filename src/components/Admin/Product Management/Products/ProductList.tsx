import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
import ProductAction from "./ProductAction";
import ProductPagination from "./ProductPagination";
import { Product, Category } from "@/types/products.types";
import Link from "next/link";

interface ProductListProps {
  products: Product[];
  categories: Category[];
  totalPages: number;
  currentPage: number;
}

export default function ProductList({
  products,
  categories,
  totalPages,
  currentPage,
}: ProductListProps) {
  const columns: TableColumn[] = [
  
{
  key: "itemName",
  header: "Product",
  render: (row: Product) => (
    <div className="flex items-center gap-3">
      {/* Image / Avatar */}
      <div className="w-10 h-10 rounded-[8px] bg-[#C0C0C0] overflow-hidden flex items-center justify-center shrink-0">
        {row.imageUrl ? (
          <img
            src={row.imageUrl}
            alt={row.itemName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs font-medium text-gray-600">
            {row.itemName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Text Content */}
      <div className="flex flex-col leading-tight">
        <span className="font-medium group-hover:text-[#4a90e2] transition">
          {row.itemName}
        </span>

        {row.genericName && (
          <span className="text-xs text-gray-500">
            Generic: {row.genericName}
          </span>
        )}

        {row.brand && (
          <span className="text-xs text-gray-500">
            Brand: {row.brand}
          </span>
        )}
      </div>
    </div>
  ),
},


    {
      key: "category",
      header: "Category",
      render: (row: Product) => (
        <Badge variant="white">{row.category?.name || "N/A"}</Badge>
      ),
    },

    {
      key: "sellingPrice",
      header: "Price",
      render: (row: Product) => (
        <span className="font-medium">
          {Number(row.sellingPrice).toFixed(2)}
        </span>
      ),
    },

    {
      key: "pricePerUnit",
      header: "Price Per Unit",
      render: (row: Product) => (
        <span className="font-medium">
          {Number(row.pricePerUnit).toFixed(2)}
        </span>
      ),
    },

    {
      key: "strength",
      header: "Strength",
      render: (row: Product) => (
        <span className="text-sm">
          {row.strength || "N/A"}
        </span>
      ),
    },

    {
      key: "baseUnit",
      header: "Base Unit",
      render: (row: Product) => (
        <span className="text-sm">
          {row.baseUnit || "N/A"}
        </span>
      ),
    },

    {
      key: "tabletsPerStrip",
      header: "Per Strip",
      render: (row: Product) => (
        <span className="text-sm">
          {row.tabletsPerStrip ? `${row.tabletsPerStrip} tablets` : "N/A"}
        </span>
      ),
    },

    {
      key: "unitPerBox",
      header: "Units Per Box",
      render: (row: Product) => {
        if (!row.unitPerBox) return <span className="text-sm text-gray-500">N/A</span>;
        
        const unitType = row.baseUnit === "TABLET" ? "strips" : 
                        row.baseUnit === "BOTTLE" ? "bottles" : "units";
        
        return (
          <span className="text-sm">
            {row.unitPerBox} {unitType}
          </span>
        );
      },
    },

    {
      key: "tabletsPerBox",
      header: "Tablets Per Box",
      render: (row: Product) => {
        if (!row.tabletsPerStrip || !row.unitPerBox) {
          return <span className="text-sm text-gray-500">N/A</span>;
        }
        
        const tabletsPerBox = row.tabletsPerStrip * row.unitPerBox;
        
        return (
          <span className="text-sm font-medium text-blue-600">
            {tabletsPerBox} tablets
          </span>
        );
      },
    },
    
    {
      key: "status",
      header: "Status",
      render: (row: Product) => (
        <Badge
          variant={row.status === "ACTIVE" ? "green" : "red"}
        >
          {row.status}
        </Badge>
      ),
    },

    {
      key: "rackLocation",
      header: "Location",
      render: (row: Product) => (
        <span className="text-sm">
          {row.rackLocation || "N/A"}
        </span>
      ),
    },

    {
      key: "action",
      header: "Action",
      render: (row: Product) => <ProductAction product={row} categories={categories} />,
    },
  ];

  return (
    <div className="w-full">
      <ReusableTable columns={columns} data={products} />

      <div className="mt-4 flex justify-end">
        <ProductPagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}