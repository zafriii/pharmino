'use client';

import React from 'react';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null; // No need for pagination if 1 page

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const renderPageNumbers = () => {
    const pages: number[] = [];

    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return pages.map((page) => (
      <button
        key={page}
        className={`w-7 h-7 flex items-center justify-center rounded-md font-medium ${
          page === currentPage
            ? 'bg-[#4a90e2] text-white'
            : 'bg-[#F1F5F9] text-[#71717A]'
        }`}
        onClick={() => onPageChange(page)}
      >
        {page}
      </button>
    ));
  };

  return (
    <div className="flex items-center gap-2 justify-end mt-4">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className={`w-7 h-7 flex items-center justify-center rounded-md  ${
          currentPage === 1
            ? 'bg-[#F1F5F9] text-[#71717A] cursor-not-allowed'
            : 'bg-[#F1F5F9] text-[#71717A]'
        }`}
      >
        <HiChevronLeft className="w-5 h-5" />
      </button>

      {renderPageNumbers()}

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`w-7 h-7 flex items-center justify-center rounded-md  ${
          currentPage === totalPages
            ? 'bg-[#F1F5F9] text-[#71717A] cursor-not-allowed'
            : 'bg-[#F1F5F9] text-[#71717A]'
        }`}
      >
        <HiChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default Pagination;
