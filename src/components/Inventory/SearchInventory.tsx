'use client';

import React from 'react';
import Search from '../Search';


interface SearchInventoryProps {
  onSearch: (query: string) => void;
  value?: string;
}

const SearchInventory: React.FC<SearchInventoryProps> = ({
  onSearch,
  value,
}) => {
  return (
    <Search
      value={value}
      onSearch={onSearch}
      placeholder="Search by name, generic name, or brand"
      delay={400}
    />
  );
};

export default SearchInventory;




