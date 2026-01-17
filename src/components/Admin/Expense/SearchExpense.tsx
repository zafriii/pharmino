'use client';

import React from 'react';
import Search from '../../Search';
// import Search from '../Search';


interface SearchExpenseProps {
  onSearch: (query: string) => void;
  value?: string;
}

const SearchExpense: React.FC<SearchExpenseProps> = ({
  onSearch,
  value,
}) => {
  return (
    <Search
      value={value}
      onSearch={onSearch}
      placeholder="Search by name"
      delay={400}
    />
  );
};

export default SearchExpense;
