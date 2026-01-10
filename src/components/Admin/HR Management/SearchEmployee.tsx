'use client';

import React from 'react';
import Search from '../Search';


interface SearchEmployeeProps {
  onSearch: (query: string) => void;
  value?: string;
}

const SearchEmployee: React.FC<SearchEmployeeProps> = ({
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

export default SearchEmployee;
