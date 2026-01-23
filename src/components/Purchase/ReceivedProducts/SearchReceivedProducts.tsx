'use client';

import React from 'react';
import Search from '../../Search';


interface SearchReceivedProductsProps {
  onSearch: (query: string) => void;
  value?: string;
}

const SearchReceivedProducts: React.FC<SearchReceivedProductsProps> = ({
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

export default SearchReceivedProducts;

