'use client';

import React from 'react';
import Search from '../../Search';


interface SearchProductProps {
  onSearch: (query: string) => void;
  value?: string;
}

const SearchProduct: React.FC<SearchProductProps> = ({
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

export default SearchProduct;
