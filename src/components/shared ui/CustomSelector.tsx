import React, { forwardRef, SelectHTMLAttributes } from 'react';
import { BiChevronDown } from 'react-icons/bi';

interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectorProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

const CustomSelector = forwardRef<HTMLSelectElement, CustomSelectorProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-gray-700 mb-1 text-[14px] font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full px-4 py-2.5 border-0 bg-gray-100 rounded-full focus:ring-2 focus:ring-[#4a90e2] focus:outline-none text-[14px] appearance-none pr-10 cursor-pointer transition-all ${
              error ? 'ring-2 ring-red-500' : ''
            } ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <BiChevronDown 
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" 
            size={20}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500 ml-2">{error}</p>
        )}
      </div>
    );
  }
);

CustomSelector.displayName = 'Select';

export default CustomSelector;

















