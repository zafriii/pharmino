'use client';

import React from 'react';
import Search from '../Search';

interface SearchPaymentProps {
  onSearch: (query: string) => void;
  value?: string;
}

const SearchPayment: React.FC<SearchPaymentProps> = ({
  onSearch,
  value,
}) => {
  return (
    <Search
      value={value}
      onSearch={onSearch}
      placeholder="Search payments by customer name, payment ID, sale ID..."
      delay={400}
    />
  );
};

export default SearchPayment;