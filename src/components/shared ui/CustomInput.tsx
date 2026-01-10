import React, { forwardRef, InputHTMLAttributes } from 'react';

interface CustomInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-gray-700 mb-1 text-[14px] font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 border-0 bg-gray-100 rounded-full focus:ring-2 focus:ring-[#4a90e2] focus:outline-none placeholder-gray-500 text-[14px] transition-all ${
            error ? 'ring-2 ring-red-500' : ''
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500 ml-2">{error}</p>
        )}
      </div>
    );
  }
);

CustomInput.displayName = 'Input';

export default CustomInput;