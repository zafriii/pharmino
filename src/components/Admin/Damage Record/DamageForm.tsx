'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ProductBatch } from '@/types/inventory.types';
import { recordDamageAction } from '@/actions/damage.actions';
import SideDrawerModal from '@/components/shared ui/SideDrawerModal';
import CustomInput from '@/components/shared ui/CustomInput';
import CustomSelector from '@/components/shared ui/CustomSelector';
import Textarea from '@/components/shared ui/Textarea';
import Button from '@/components/shared ui/Button';
import Toast from '@/components/shared ui/Toast';
import { ImSpinner2 } from 'react-icons/im';
import { GoCheck } from 'react-icons/go';
import { RxCross2 } from 'react-icons/rx';

interface DamageFormData {
  batchId: string;
  quantity: number;
  reason: string;
}

interface DamageFormProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  itemId: number;
  itemName: string;
  batches: ProductBatch[];
  onSuccess?: () => void;
}

export default function DamageForm({
  open,
  setOpen,
  itemId,
  itemName,
  batches,
  onSuccess,
}: DamageFormProps) {
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'fail';
  } | null>(null);

  // Filter active batches with available quantity
  const availableBatches = batches.filter(
    (batch) => batch.quantity > 0
  );

  const { 
    register, 
    handleSubmit, 
    watch,
    reset, 
    formState: { errors }, 
    setValue 
  } = useForm<DamageFormData>({
    defaultValues: {
      batchId: '',
      quantity: 1,
      reason: '',
    },
  });

  // Reset form when modal opens
  React.useEffect(() => {
    if (open) {
      reset({
        batchId: '',
        quantity: 1,
        reason: '',
      });
      setToastMessage(null);
    }
  }, [open, reset]);

  const watchedBatchId = watch('batchId');
  const watchedQuantity = watch('quantity');
  const watchedReason = watch('reason');

  const batchOptions = [
    { value: '', label: 'Choose a batch' },
    ...availableBatches.map((batch) => ({
      value: batch.id.toString(),
      label: `${batch.batchNumber} (${batch.quantity} available)`,
    }))
  ];

  const selectedBatch = availableBatches.find(
    (batch) => batch.id.toString() === watchedBatchId
  );

  const onSubmit = async (data: DamageFormData) => {
    if (!data.batchId) {
      setToastMessage({
        message: 'Please select a batch',
        type: 'error',
      });
      return;
    }

    // Find the selected batch from the current batches array (fresh data)
    const selectedBatch = availableBatches.find(
      (batch) => batch.id.toString() === data.batchId
    );

    if (!selectedBatch) {
      setToastMessage({
        message: 'Selected batch not found or no longer available',
        type: 'error',
      });
      return;
    }

    if (data.quantity > selectedBatch.quantity) {
      setToastMessage({
        message: `Quantity cannot exceed available stock (${selectedBatch.quantity})`,
        type: 'error',
      });
      return;
    }

    if (!watchedReason?.trim()) {
      setToastMessage({
        message: 'Reason is required',
        type: 'error',
      });
      return;
    }

    if (watchedReason.length > 500) {
      setToastMessage({
        message: 'Reason must be less than 500 characters',
        type: 'error',
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await recordDamageAction(itemId, {
          batchId: parseInt(data.batchId),
          quantity: data.quantity,
          reason: watchedReason.trim(),
        });

        if (result.success) {
          setToastMessage({
            message: result.message || 'Damage recorded successfully',
            type: 'success',
          });
          
          reset();
          setOpen(false);
          onSuccess?.();
        } else {
          setToastMessage({
            message: result.error || 'Failed to record damage',
            type: 'fail',
          });
        }
      } catch (error: any) {
        setToastMessage({
          message: error.message || 'An unexpected error occurred',
          type: 'fail',
        });
      }
    });
  };

  return (
    <>
      <SideDrawerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Record Damage"
        footerButtons={
          <>
            <Button
              onClick={() => setOpen(false)}
              variant="secondary"
              leftIcon={<RxCross2 />}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button
              form="damageForm"
              type="submit"
              variant="primary"
              disabled={isPending || availableBatches.length === 0}
              leftIcon={isPending ? <ImSpinner2 className="animate-spin" /> : <GoCheck />}
            >
              {isPending ? 'Saving' : 'Record Damage'}
            </Button>
          </>
        }
      >
        <form id="damageForm" onSubmit={handleSubmit(onSubmit)} className="space-y-6">          
          <div>
            <h3 className="text-lg font-medium text-gray-900 ">
               {itemName}
            </h3>            
          </div>

          <div className="space-y-4">
            <div>
              <CustomSelector
                label="Select Batch *"
                options={batchOptions}
                {...register('batchId', { required: 'Please select a batch' })}
                error={errors.batchId?.message}
                disabled={availableBatches.length === 0}
              />
              {availableBatches.length === 0 && (
                <p className="text-yellow-600 text-sm mt-1">
                  No active batches with available quantity found
                </p>
              )}
            </div>

            {selectedBatch && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Batch Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Batch: </span>
                    <span className="font-medium">{selectedBatch.batchNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Available: </span>
                    <span className="font-medium">{selectedBatch.quantity} units</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Supplier: </span>
                    <span className="font-medium">{selectedBatch.supplier}</span>
                  </div>
                  {selectedBatch.expiryDate && (
                    <div>
                      <span className="text-gray-600">Expires: </span>
                      <span className="font-medium">
                        {new Date(selectedBatch.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <CustomInput
                label="Damage Quantity *"
                type="number"
                placeholder="Enter quantity"
                min="1"
                max={selectedBatch?.quantity || undefined}
                {...register('quantity', { 
                  required: 'Quantity is required',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Quantity must be at least 1' },
                  max: { 
                    value: selectedBatch?.quantity || 999999, 
                    message: `Quantity cannot exceed available stock (${selectedBatch?.quantity || 0})` 
                  }
                })}
                error={errors.quantity?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Damage *
              </label>
              <Textarea
                value={watchedReason || ''}
                onChange={(e) => setValue('reason', e.target.value)}
                placeholder="Describe the reason for damage (e.g., broken bottles, expired tablets, etc.)"
                rows={4}
                error={errors.reason?.message}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-gray-500 text-sm ml-auto">
                  {watchedReason?.length || 0}/500 characters
                </p>
              </div>
            </div>
          </div>
        </form>
      </SideDrawerModal>

      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
}

