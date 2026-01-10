'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  label: string;
  value: string | number;
}

interface CustomDropdownProps {
  options: Option[];
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  placeholder: string; 
}

const CustomDropdown = ({ options, selectedValue, onSelect, placeholder }: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLabel = options.find(opt => opt.value === selectedValue)?.label || placeholder;

  const handleSelect = (value: string | number) => {
    onSelect(value);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        type="button"
        className="
          inline-flex justify-between items-center 
          rounded-full bg-[#F1F5F9] px-4 py-2 text-sm font-medium text-gray-700
          transition-colors hover:bg-gray-200
          focus:outline-none focus:ring-0 focus:border-transparent
          whitespace-nowrap overflow-hidden text-ellipsis
          max-w-[150px] md:max-w-[200px]
        "
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        {currentLabel}
        <ChevronDown 
          className={`-mr-1 ml-2 h-4 w-4 text-gray-600 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
          aria-hidden="true" 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute left-0 z-20 mt-2 min-w-[max-content] rounded-lg bg-white shadow-xl"
        >
          <div className="py-1">
            {options.map((option) => (
              <a
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`
                  block px-4 py-2 text-sm cursor-pointer transition-colors
                  whitespace-nowrap overflow-hidden text-ellipsis
                  ${selectedValue === option.value 
                    ? 'bg-gray-100 text-[#4a90e2] font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {option.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
