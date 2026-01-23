'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/shared ui/Button';
import CustomDropdown from '@/components/shared ui/CustomDropdown';
import { GoPlus } from 'react-icons/go';
import EmployeeForm from './EmployeeForm';
import SearchEmployee from '../SearchEmployee'; 

interface Option {
  label: string;
  value: string | number;
}

const statusOptions: Option[] = [
  { label: 'All Status', value: '' },
  { label: 'ACTIVE', value: 'ACTIVE' },
  { label: 'ON_LEAVE', value: 'ON_LEAVE' },
  { label: 'INACTIVE', value: 'INACTIVE' },
];

const dutyOptions: Option[] = [
  { label: 'All Duty Types', value: '' },
  { label: 'FULL_TIME', value: 'FULL_TIME' },
  { label: 'PART_TIME', value: 'PART_TIME' },
];

const roleOptions: Option[] = [
  { label: 'All Roles', value: '' },
  { label: 'ADMIN', value: 'ADMIN' },
  { label: 'CASHIER', value: 'CASHIER' },
  { label: 'PHARMACIST', value: 'PHARMACIST' },
  { label: 'OWNER', value: 'OWNER' },
  { label: 'STOREKEEPER', value: 'STOREKEEPER' },
];

const shiftOptions: Option[] = [
  { label: 'All Shifts', value: '' },
  { label: 'DAY', value: 'DAY' },
  { label: 'NIGHT', value: 'NIGHT' },
];

export default function EmployeeWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [openForm, setOpenForm] = useState(false);

  // Handle search changes via debounced component
  const handleSearch = (query: string) => {
    updateURL('search', query);
  };

  const updateURL = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset page to 1 on filter/search
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Search + Create Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
        {/* Search Employee */}
        <div className="flex-1 w-full md:max-w-3xl">
          <SearchEmployee
            value={searchParams.get('search') || ''}
            onSearch={handleSearch}
          />
        </div>

        {/* Create Employee Button */}
        <div className="flex-shrink-0">
          <Button
            className="flex items-center gap-2 px-3 py-2 rounded-full h-10 "
            variant="primary"
            onClick={() => setOpenForm(true)}
          >
            <GoPlus className="w-4 h-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* 4 types of employee Filters */}
      <div className="flex flex-wrap gap-3">
        <CustomDropdown
          options={statusOptions}
          selectedValue={searchParams.get('status') || ''}
          onSelect={(value) => updateURL('status', value.toString())}
          placeholder="All Status"
        />
        <CustomDropdown
          options={dutyOptions}
          selectedValue={searchParams.get('duty') || ''}
          onSelect={(value) => updateURL('duty', value.toString())}
          placeholder="Duty Type"
        />
        <CustomDropdown
          options={shiftOptions}
          selectedValue={searchParams.get('shift') || ''}
          onSelect={(value) => updateURL('shift', value.toString())}
          placeholder="Shift"
        />
        <CustomDropdown
          options={roleOptions}
          selectedValue={searchParams.get('role') || ''}
          onSelect={(value) => updateURL('role', value.toString())}
          placeholder="All Roles"
        />
      </div>

      {/* Employee Create Form Modal */}
      <EmployeeForm open={openForm} setOpen={setOpenForm} />
    </div>
  );
}
