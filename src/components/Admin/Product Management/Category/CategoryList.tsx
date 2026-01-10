import ReusableTable, { TableColumn } from "@/components/shared ui/ReusableTable";
import Badge from "@/components/shared ui/Badge";
import CategoryAction from "./CategoryAction";
import { Category } from "@/types/category.types";

interface CategoryListProps {
  categories: Category[];
}

export default function CategoryList({ categories }: CategoryListProps) {
  const columns: TableColumn[] = [
    {
      key: "name",
      header: "Category",
      render: (row: Category) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-[#C0C0C0] overflow-hidden flex items-center justify-center">
            {row.imageUrl ? (
              <img
                src={row.imageUrl}
                alt={row.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-medium text-gray-600">
                {row.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <span className="font-medium block">{row.name}</span>
          </div>
        </div>
      ),
    },

    {
      key: "itemCount",
      header: "Items",
      render: (row: Category) => (
        <Badge variant="white">
          {row.itemCount ?? 0} {(row.itemCount ?? 0) > 1 ? "items" : "item"}
        </Badge>
      ),
    },
    
    {
      key: "action",
      header: "Action",
      render: (row: Category) => <CategoryAction category={row} />,
    },
  ];

  return (
    <div className="w-full">
      <ReusableTable columns={columns} data={categories} />
    </div>
  );
}