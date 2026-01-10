'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import SearchBar from '@/components/shared ui/SearchBar';
import debounce from 'lodash/debounce';
import { ImSpinner2 } from 'react-icons/im';

interface SearchProps {
  onSearch: (query: string) => void;
  value?: string;
  placeholder?: string;
  delay?: number;
}

const Search: React.FC<SearchProps> = ({
  onSearch,
  value = '',
  placeholder = 'Search',
  delay = 300,
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [loading, setLoading] = useState(false);
  const lastExternalValue = useRef(value);
  const isUserTyping = useRef(false);

  // Create a stable debounced function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch(query);
      setLoading(false);
      isUserTyping.current = false;
    }, delay),
    [onSearch, delay]
  );

  // Only sync with external value when it's actually different and user isn't actively typing
  useEffect(() => {
    if (value !== lastExternalValue.current && !isUserTyping.current) {
      lastExternalValue.current = value;
      setSearchQuery(value);
      debouncedSearch.cancel();
      setLoading(false);
    }
  }, [value, debouncedSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Mark that user is actively typing
    isUserTyping.current = true;
    
    // Update local state immediately for smooth UX
    setSearchQuery(val);
    setLoading(true);

    // Debounce the actual search
    debouncedSearch(val);
  };

  return (
    <div className="relative w-full max-w-lg">
      <SearchBar
        value={searchQuery}
        onChange={handleChange}
        placeholder={placeholder}
      />

      {loading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <ImSpinner2 className="animate-spin text-gray-500 h-4 w-4" />
        </div>
      )}
    </div>
  );
};

export default Search;
