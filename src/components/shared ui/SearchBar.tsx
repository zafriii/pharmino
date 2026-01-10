import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const SearchBar = ({ value, onChange, placeholder }: SearchBarProps) => {
  return (
    <div className="relative w-full max-w-lg">
      <div className="flex items-center bg-[#F1F5F9] rounded-full px-4 h-9">
        {/* h-8 = 32px height */}

        {/* Search Icon */}
        <Search className="h-5 w-5 text-gray-500 mr-3" />

        {/* Input Field */}
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-transparent text-gray-800 placeholder-gray-500 focus:outline-none text-sm h-full"
        />
      </div>
    </div>
  );
};

export default SearchBar;





