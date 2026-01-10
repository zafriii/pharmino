import React from 'react';
import ReusableTable, { TableColumn } from '@/components/shared ui/ReusableTable';
import Badge from '@/components/shared ui/Badge';
import { DamageRecord } from '@/types/damage.types';
import DamagePagination from './DamagePagination';

interface DamageListProps {
  damages: DamageRecord[];
  totalPages: number;
  currentPage: number;
}

export default function DamageList({
  damages,
  totalPages,
  currentPage,
}: DamageListProps) {
  const columns: TableColumn[] = [
    {
      key: 'item',
      header: 'Product',
      render: (row: DamageRecord) => (
        <div>
          <span className="font-medium block">{row.item.itemName}</span>
          {row.item.genericName && (
            <span className="text-xs text-gray-500 block">
              Generic: {row.item.genericName}
            </span>
          )}
          {row.item.brand && (
            <span className="text-xs text-gray-500 block">
              Brand: {row.item.brand}
            </span>
          )}
        </div>
      ),
    },

    {
      key: 'batch',
      header: 'Batch Details',
      render: (row: DamageRecord) => (
        <div className="space-y-1 text-sm">
          <div>
            <span className="font-medium">{row.batch.batchNumber}</span>
          </div>
          <div>
            <span className="text-gray-600">Supplier: </span>
            <span>{row.batch.supplier}</span>
          </div>
          {row.batch.expiryDate && (
            <div>
              <span className="text-gray-600">Expires: </span>
              <span>
                {new Date(row.batch.expiryDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      ),
    },

    {
      key: 'quantity',
      header: 'Damage Quantity',
      render: (row: DamageRecord) => (
        <div className="text-center">
          <span className="font-medium text-red-600 text-lg">
            {row.quantity}
          </span>
          <span className="text-gray-500 text-sm block">
            {row.quantity > 1 ? 'units' : 'unit'}
          </span>
        </div>
      ),
    },

    {
      key: 'reason',
      header: 'Reason',
      render: (row: DamageRecord) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-700 line-clamp-3">
            {row.reason}
          </p>
        </div>
      ),
    },

    {
      key: 'creator',
      header: 'Recorded By',
      render: (row: DamageRecord) => (
        <div className="text-sm">
          <span className="font-medium block">{row.creator.name}</span>
          <span className="text-gray-500 text-xs">
            {row.creator.email}
          </span>
        </div>
      ),
    },

    {
      key: 'createdAt',
      header: 'Damage Recorded',
      render: (row: DamageRecord) => (
        <div className="text-sm">
          <span className="block">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
          <span className="text-gray-500 text-xs">
            {new Date(row.createdAt).toLocaleTimeString()}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      <ReusableTable columns={columns} data={damages} />

      <div className="mt-4 flex justify-end">
        <DamagePagination
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
