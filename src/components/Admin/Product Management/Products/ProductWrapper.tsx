'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/shared ui/Button';
import CustomDropdown from '@/components/shared ui/CustomDropdown';
import { GoPlus } from 'react-icons/go';
import ProductForm from './ProductForm';
import SearchProduct from './SearchProduct';
import type { Category } from '@/types/products.types';

interface Option {
  label: string;
  value: string | number;
}

const statusOptions: Option[] = [
  { label: 'All Status', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];


interface ProductWrapperProps {
  categories: Category[];
}

export default function ProductWrapper({ categories }: ProductWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [openForm, setOpenForm] = useState(false);

  // Create category options for dropdown
  const categoryOptions: Option[] = [
    { label: 'All Categories', value: '' },
    ...categories.map(cat => ({ label: cat.name, value: cat.id.toString() }))
  ];



  // Handle search changes via debounced component
  const handleSearch = (query: string) => {
    updateURL('search', query);
  };

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValue = params.get(key) || '';
    
    // Only update if the value actually changed
    if (currentValue === value) return;
    
    if (value && value.trim() !== '') {
      params.set(key, value.trim());
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset page to 1 on filter/search
    
    const newUrl = `?${params.toString()}`;
    
    startTransition(() => {
      // Use replace instead of push to avoid scroll jumping
      router.replace(newUrl, { scroll: false });
    });
  };

  const handleAddProduct = () => {
    if (categories.length === 0) {
      alert('Please create at least one category before adding products.');
      return;
    }
    setOpenForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Search + Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
        {/* Search Product */}
        <div className="flex-1 w-full md:max-w-3xl">
          <SearchProduct
            value={searchParams.get('search') || ''}
            onSearch={handleSearch}
          />
        </div>

        {/* Create Product Button */}
        <div className="flex-shrink-0">
          <Button
            className="flex items-center gap-2 px-3 py-2 rounded-full h-10"
            variant="primary"
            onClick={handleAddProduct}
          >
            <GoPlus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Product Filters - Category and Status (API), Stock Status (Client-side) */}
      {/* <div className="flex flex-wrap gap-3">
        <CustomDropdown
          options={categoryOptions}
          selectedValue={searchParams.get('categoryId') || ''}
          onSelect={(value) => updateURL('categoryId', value.toString())}
          placeholder="All Categories"
        />
        <CustomDropdown
          options={statusOptions}
          selectedValue={searchParams.get('status') || ''}
          onSelect={(value) => updateURL('status', value.toString())}
          placeholder="All Status"
        />
      </div> */}

      <div className="flex flex-wrap gap-3">
            <CustomDropdown
            options={categoryOptions}
            selectedValue={searchParams.get('categoryId') || 'ALL'}
            onSelect={(value) => updateURL('categoryId', value === 'ALL' ? '' : value.toString())}
            placeholder="All Categories"
          />

          <CustomDropdown
            options={statusOptions}
            selectedValue={searchParams.get('status') || 'ALL'}
            onSelect={(value) => updateURL('status', value === 'ALL' ? '' : value.toString())}
            placeholder="All Status"
          />
      </div>
      
      {/* Product Create Form Modal */}
      <ProductForm 
        open={openForm} 
        setOpen={setOpenForm} 
        categories={categories}
        onSuccess={() => {
        }}
      />
    </div>
  );
}










