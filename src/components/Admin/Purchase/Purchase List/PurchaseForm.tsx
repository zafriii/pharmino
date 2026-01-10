'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';

import SideDrawerModal from '@/components/shared ui/SideDrawerModal';
import Button from '@/components/shared ui/Button';
import CustomInput from '@/components/shared ui/CustomInput';
import CustomSelector from '@/components/shared ui/CustomSelector';
import Toast from '@/components/shared ui/Toast';
import CrossButton from '@/components/shared ui/CrossButton';

import { GoCheck, GoPlus } from 'react-icons/go';
import { RxCross2 } from 'react-icons/rx';
import { ImSpinner2 } from 'react-icons/im';

import {
  getProductsForPurchaseAction,
  createPurchaseOrderAction,
  updatePurchaseOrderAction,
} from '@/actions/purchase.actions';

import {
  PurchaseFormValues,
  PurchaseFormItem,
  PurchaseOrder,
} from '@/types/purchase.types';

interface PurchaseFormProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  purchase?: PurchaseOrder;
  onSuccess?: () => void;
}

const initialValues: PurchaseFormItem = {
  itemId: 0,
  supplier: '',
  quantity: 1,
  puchasePrice: 0,
};

export default function PurchaseForm({
  open,
  setOpen,
  purchase,
  onSuccess,
}: PurchaseFormProps) {
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'fail';
  } | null>(null);

  const defaultValues: PurchaseFormValues = purchase
    ? {
        items: purchase.items.map((item: any) => ({
          itemId: item.itemId,
          supplier: item.supplier,
          quantity: item.quantity,
          puchasePrice: Number(item.puchasePrice || 0),
        })),
      }
    
    : {
        items: [{ ...initialValues }],
      };

  const { 
    register, 
    handleSubmit, 
    control, 
    reset, 
    setValue 
  } = useForm<PurchaseFormValues>({
      defaultValues,
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // ---------- Fetch products ----------
  const fetchProducts = async () => {
    if (products.length > 0 || loadingProducts) return;
    setLoadingProducts(true);

    try {
      const res = await getProductsForPurchaseAction();
      if (res.success) {
        setProducts(res.data);
      } else {
        setToastMessage({
          message: res.error || 'Failed to load products',
          type: 'error',
        });
      }
    } catch (error) {
      setToastMessage({
        message: 'Failed to load products',
        type: 'error',
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  // Use useEffect to fetch products when component mounts or modal opens
  useEffect(() => {
    if (open && products.length === 0 && !loadingProducts) {
      fetchProducts();
    }
  }, [open]);

  // ---------- Submit ----------
  const onSubmit = async (data: PurchaseFormValues) => {
    const validItems = data.items.filter(
      (i) =>
        i.itemId > 0 &&
        i.supplier.trim() &&
        i.quantity > 0 &&
        i.puchasePrice > 0
    );

    if (!validItems.length) {
      setToastMessage({
        message: 'Please add at least one valid item.',
        type: 'error',
      });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('items', JSON.stringify(validItems));

      const result = purchase?.id
        ? await updatePurchaseOrderAction(purchase.id, formData)
        : await createPurchaseOrderAction(formData);

      if (result?.success) {
        setToastMessage({
          message: result.message || 'Purchase saved',
          type: 'success',
        });

        reset({ items: [{ ...initialValues }] });
        setOpen(false);
        onSuccess?.();
      } else {
        setToastMessage({
          message: result?.error || 'Something went wrong',
          type: 'fail',
        });
      }
    });
  };

  // ---------- Product options ----------
  const productOptions = loadingProducts
    ? [{ value: '0', label: 'Loading products...' }]
    : [
        { value: '0', label: 'Select a product' },
        ...products.map((p) => ({ value: String(p.id), label: p.itemName })),
      ];

  return (
    <>
      <SideDrawerModal
        key={purchase?.id || 'new'}
        isOpen={open}
        onClose={() => setOpen(false)}
        title={purchase ? 'Update Purchase List' : 'Make Purchase List'}
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
              form="purchaseForm"
              type="submit"
              variant="primary"
              disabled={isPending}
              leftIcon={
                isPending ? <ImSpinner2 className="animate-spin" /> : <GoCheck />
              }
            >
              {isPending
                ? purchase
                  ? 'Updating'
                  : 'Saving'
                : purchase
                ? 'Update Purchase List'
                : 'Make Purchase List'}
            </Button>
          </>
        }
      >
        <form
          id="purchaseForm"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <h3 className="text-lg font-medium">Purchase Items</h3>

          {fields.map((field, index) => (
            <div key={field.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Item {index + 1}</h4>
                {fields.length > 1 && (
                  <CrossButton
                    ariaLabel="remove-item"
                    onClick={() => remove(index)}
                  />
                )}
              </div>

              <CustomSelector
                label="Product Name"
                options={productOptions}
                {...register(`items.${index}.itemId`, { valueAsNumber: true })}
                defaultValue={
                  defaultValues.items[index]?.itemId?.toString() || '0'
                }
              />

              <CustomInput
                label="Supplier"
                placeholder="Beximo"
                {...register(`items.${index}.supplier`)}
                defaultValue={defaultValues.items[index]?.supplier || ''}
              />

              <div className="grid grid-cols-2 gap-3">
                <CustomInput
                  label="Quantity"
                  type="number"
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  defaultValue={defaultValues.items[index]?.quantity || 1}
                />
                <CustomInput
                  label="Purchase Price"
                  type="number"
                  step="0.01"
                  {...register(`items.${index}.puchasePrice`, { valueAsNumber: true })}
                  defaultValue={defaultValues.items[index]?.puchasePrice || 0}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => append({ ...initialValues })}
            className="w-full flex items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 py-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4a90e2] text-white">
              <GoPlus />
            </span>
            <span className="font-medium">Add More Products</span>
          </button>
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














