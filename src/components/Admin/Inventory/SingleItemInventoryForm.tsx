'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import SideDrawerModal from '@/components/shared ui/SideDrawerModal';
import Button from '@/components/shared ui/Button';
import CustomInput from '@/components/shared ui/CustomInput';
import Toast from '@/components/shared ui/Toast';
import Badge from '@/components/shared ui/Badge';

import { GoCheck } from 'react-icons/go';
import { RxCross2 } from 'react-icons/rx';
import { ImSpinner2 } from 'react-icons/im';

import { addSingleItemToInventoryAction } from '@/actions/inventory.actions';
import { ReceivedItem } from '@/types/receivedProducts.types';
import { InventoryFormData } from '@/types/inventory.types';

interface SingleItemInventoryFormProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  receivedItem: ReceivedItem;
  onSuccess?: () => void;
}

export default function SingleItemInventoryForm({
  open,
  setOpen,
  receivedItem,
  onSuccess,
}: SingleItemInventoryFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'fail';
  } | null>(null);

  const defaultValues: InventoryFormData = {
    quantity: receivedItem.remainingQuantity,
    purchasePrice: Number(receivedItem.purchaseItem.puchasePrice),
    sellingPrice: Number(receivedItem.purchaseItem.item.sellingPrice || 0),
    expiryDate: '',
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InventoryFormData>({
    defaultValues,
  });

  const onSubmit = async (data: InventoryFormData) => {
    // Check if item can still be added to inventory
    if (!receivedItem.canAddToInventory || receivedItem.remainingQuantity <= 0 || receivedItem.isFullyProcessed) {
      setToastMessage({
        message: 'This item has already been fully added to inventory.',
        type: 'error',
      });
      setOpen(false); // Close the form
      return;
    }
    
    if (data.quantity <= 0 || data.purchasePrice <= 0 || data.sellingPrice <= 0) {
      setToastMessage({
        message: 'Please ensure all fields have valid values.',
        type: 'error',
      });
      return;
    }

    if (data.quantity > receivedItem.remainingQuantity) {
      setToastMessage({
        message: `Quantity cannot exceed remaining quantity (${receivedItem.remainingQuantity})`,
        type: 'error',
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await addSingleItemToInventoryAction(
          receivedItem.id, 
          {
            quantity: data.quantity,
            purchasePrice: data.purchasePrice,
            sellingPrice: data.sellingPrice,
            expiryDate: data.expiryDate || undefined,
          },
          {
            purchaseItem: {
              itemId: receivedItem.purchaseItem.itemId,
              supplier: receivedItem.purchaseItem.supplier,
            }
          }
        );

        if (result.success) {
          setToastMessage({
            message: result.message || 'Item successfully added to inventory',
            type: 'success',
          });

          setOpen(false);
          onSuccess?.();
          
          // Immediately refresh to get updated data
          router.refresh();
        } else {
          setToastMessage({
            message: result.error || 'Failed to add item to inventory',
            type: 'fail',
          });
        }
      } catch (error: any) {
        setToastMessage({
          message: error.message || 'Failed to add item to inventory',
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
        title="Add Item to Inventory"
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
              form="singleInventoryForm"
              type="submit"
              variant="primary"
              disabled={isPending}
              leftIcon={
                isPending ? (
                  <ImSpinner2 className="animate-spin" />
                ) : (
                  <GoCheck />
                )
              }
            >
              {isPending ? 'Adding to Inventory' : 'Add to Inventory'}
            </Button>
          </>
        }
      >
        <form
          id="singleInventoryForm"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Product Information */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-[8px] bg-[#C0C0C0] overflow-hidden flex items-center justify-center">
                {receivedItem.purchaseItem.item.imageUrl ? (
                  <img
                    src={receivedItem.purchaseItem.item.imageUrl}
                    alt={receivedItem.purchaseItem.item.itemName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-gray-600">
                    {receivedItem.purchaseItem.item.itemName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-medium text-lg">{receivedItem.purchaseItem.item.itemName}</h3>
                {receivedItem.purchaseItem.item.brand && (
                  <p className="text-sm text-gray-600">Brand: {receivedItem.purchaseItem.item.brand}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="white">{receivedItem.purchaseItem.item.category.name}</Badge>
              <Badge variant="blue">PO: {receivedItem.purchaseItem.purchaseOrder.id}</Badge>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              label="Supplier"
              value={receivedItem.purchaseItem.supplier}
              disabled
              readOnly
            />
            <CustomInput
              label="Remaining Quantity"
              value={receivedItem.remainingQuantity}
              disabled
              readOnly
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              label="Quantity to Add"
              type="number"
              min="1"
              max={receivedItem.remainingQuantity}
              placeholder={`Max: ${receivedItem.remainingQuantity}`}
              {...register('quantity', {
                valueAsNumber: true,
                min: { value: 1, message: 'Quantity must be at least 1' },
                max: { 
                  value: receivedItem.remainingQuantity, 
                  message: `Cannot exceed remaining quantity (${receivedItem.remainingQuantity})` 
                },
                required: 'Quantity is required'
              })}
              error={errors.quantity?.message}
            />
            <CustomInput
              label="Purchase Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('purchasePrice', {
                valueAsNumber: true,
                min: { value: 0.01, message: 'Purchase price must be greater than 0' },
                required: 'Purchase price is required'
              })}
              error={errors.purchasePrice?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              label="Selling Price"
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('sellingPrice', {
                valueAsNumber: true,
                min: { value: 0.01, message: 'Selling price must be greater than 0' },
                required: 'Selling price is required'
              })}
              error={errors.sellingPrice?.message}
            />
            <CustomInput
              label="Expiry Date (Optional)"
              type="date"
              min={new Date().toISOString().split('T')[0]}
              {...register('expiryDate')}
            />
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