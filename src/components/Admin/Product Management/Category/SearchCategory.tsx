'use client';

import React from 'react';
import Search from '../../Search';


interface SearchCategoryProps {
  onSearch: (query: string) => void;
  value?: string;
}

const SearchCategory: React.FC<SearchCategoryProps> = ({
  onSearch,
  value,
}) => {
  return (
    <Search
      value={value}
      onSearch={onSearch}
      placeholder="Search categories"
      delay={400}
    />
  );
};

export default SearchCategory;
