'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import EditButton from '@/components/shared ui/EditButton';
import SideDrawerModal from '@/components/shared ui/SideDrawerModal';
import Button from '@/components/shared ui/Button';
import CustomInput from '@/components/shared ui/CustomInput';
import SwitchButton from '@/components/shared ui/SwitchButton';
import Toast from '@/components/shared ui/Toast';

import { GoCheck } from 'react-icons/go';
import { RxCross2 } from 'react-icons/rx';
import { ImSpinner2 } from 'react-icons/im';

import { ProductBatch } from '@/types/inventory.types';
import { updateBatchAction } from '@/actions/batch.actions';
import { getTodayLocalDate } from '@/lib/utils';

interface BatchListActionProps {
  batch: ProductBatch;
  onSuccess?: () => void;
}

interface BatchFormValues {
  expiryDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export default function BatchListAction({ batch, onSuccess }: BatchListActionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'fail';
  } | null>(null);

  const defaultValues: BatchFormValues = {
    expiryDate: batch.expiryDate ? new Date(batch.expiryDate).toISOString().split('T')[0] : '',
    status: batch.status as 'ACTIVE' | 'INACTIVE',
  };

  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors }, 
    setValue,
    watch
  } = useForm<BatchFormValues>({
    defaultValues,
  });

  const onSubmit = async (data: BatchFormValues) => {
    startTransition(async () => {
      try {
        const result = await updateBatchAction(batch.id, {
          expiryDate: data.expiryDate || null,
          status: data.status,
        });

        if (result.success) {
          setToastMessage({
            message: result.message || 'Batch updated successfully',
            type: 'success',
          });

          setIsModalOpen(false);
          onSuccess?.();
        } else {
          setToastMessage({
            message: result.error || result.message || 'Failed to update batch',
            type: 'fail',
          });
        }
      } catch (error: any) {
        setToastMessage({
          message: error.message || 'Something went wrong',
          type: 'fail',
        });
      }
    });
  };

  const handleOpenModal = () => {
    reset(defaultValues);
    setIsModalOpen(true);
  };

  return (
    <>
      <EditButton
        variant="secondary"
        onClick={handleOpenModal}
        ariaLabel={`Edit batch ${batch.batchNumber}`}
      />

      <SideDrawerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Edit Batch: ${batch.batchNumber}`}
        footerButtons={
          <>
            <Button 
              onClick={() => setIsModalOpen(false)} 
              variant="secondary" 
              leftIcon={<RxCross2 />}
            >
              Cancel
            </Button>

            <Button
              form="batchEditForm"
              type="submit"
              variant="primary"
              leftIcon={isPending ? <ImSpinner2 className="animate-spin" /> : <GoCheck />}
              disabled={isPending}
            >
              {isPending ? 'Updating' : 'Update Batch'}
            </Button>
          </>
        }
      >
        <form id="batchEditForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-medium text-gray-900">Batch Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Batch Number:</span>
                <span className="ml-2 font-medium">{batch.batchNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Quantity:</span>
                <span className="ml-2 font-medium">{batch.quantity}</span>
              </div>
              <div>
                <span className="text-gray-600">Purchase Price:</span>
                <span className="ml-2 font-medium">{batch.purchasePrice}</span>
              </div>
              <div>
                <span className="text-gray-600">Selling Price:</span>
                <span className="ml-2 font-medium">{batch.sellingPrice}</span>
              </div>
            </div>
          </div>

          <CustomInput
            label="Expiry Date"
            type="date"
            min={getTodayLocalDate()}
            {...register('expiryDate')}
            error={errors.expiryDate?.message}
          />

          <div className="w-full">
            <label className="block text-gray-700 mb-1 text-[14px] font-medium">
              Batch Status
            </label>
            <div className="bg-gray-100 rounded-lg px-3 py-2 flex items-center">
              <SwitchButton
                value={watch('status') === 'ACTIVE' ? 'AVAILABLE' : 'UNAVAILABLE'}
                onChange={(newValue) => setValue('status', newValue === 'AVAILABLE' ? 'ACTIVE' : 'INACTIVE')}
              />
              <span className="ml-3 text-[13px] text-gray-600">
                {watch('status') === 'ACTIVE' ? 'Active' : 'Inactive'}
              </span>
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