"use client";

import React from "react";
import FilterTabs from "@/components/shared ui/FilterTabs";

interface SaleTabsProps {
  categories: Array<{id: number; name: string}>;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const SaleTabs: React.FC<SaleTabsProps> = ({
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  // Prepare category tabs
  const categoryTabs = [
    { id: "all", label: "All Products" },
    ...categories.map(category => ({
      id: category.id.toString(),
      label: category.name
    }))
  ];

  return (
    <FilterTabs
      tabs={categoryTabs}
      onTabChange={onCategoryChange}
      initialActiveTab={selectedCategory}
    />
  );
};

export default SaleTabs;