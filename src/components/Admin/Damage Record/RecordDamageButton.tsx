'use client';

import React, { useState } from 'react';
import Button from '@/components/shared ui/Button';
import DamageForm from '@/components/Admin/Damage Record/DamageForm';
import { ProductBatch } from '@/types/inventory.types';
import { MdReportProblem } from 'react-icons/md';

interface RecordDamageButtonProps {
  itemId: number;
  itemName: string;
  batches: ProductBatch[];
}

export default function RecordDamageButton({
  itemId,
  itemName,
  batches,
}: RecordDamageButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = () => {
    setIsModalOpen(false);
  };

  const hasAvailableBatches = batches.some(
    (batch) => batch.status === 'ACTIVE' && batch.quantity > 0
  );

  return (
    <>
      <Button
        variant="secondary"
        leftIcon={<MdReportProblem className="text-lg" />}
        onClick={() => setIsModalOpen(true)}
        disabled={!hasAvailableBatches}
        className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 px-6 py-2 flex items-center gap-2 whitespace-nowrap "
      >
        <span className="font-medium">Record Damage</span>
      </Button>

      <DamageForm
        open={isModalOpen}
        setOpen={setIsModalOpen}
        itemId={itemId}
        itemName={itemName}
        batches={batches}
        onSuccess={handleSuccess}
      />
    </>
  );
}