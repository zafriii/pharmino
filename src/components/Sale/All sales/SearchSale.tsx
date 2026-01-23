'use client';

import React from 'react';
import Search from '../../Search';

interface SearchSaleProps {
  onSearch: (query: string) => void;
  value?: string;
}

const SearchSale: React.FC<SearchSaleProps> = ({
  onSearch,
  value,
}) => {
  return (
    <Search
      value={value}
      onSearch={onSearch}
      placeholder="Search sales by customer name, sale ID..."
      delay={400}
    />
  );
};

export default SearchSale;