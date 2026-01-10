'use client';

import React from 'react';
import Search from '../Search';


interface SearchPurchaseProps {
  onSearch: (query: string) => void;
  value?: string;
}

const SearchPurchase: React.FC<SearchPurchaseProps> = ({
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

export default SearchPurchase;
