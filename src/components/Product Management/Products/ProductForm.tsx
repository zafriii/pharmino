'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import SideDrawerModal from '@/components/shared ui/SideDrawerModal';
import Button from '@/components/shared ui/Button';
import CustomInput from '@/components/shared ui/CustomInput';
import CustomSelector from '@/components/shared ui/CustomSelector';
import SwitchButton from '@/components/shared ui/SwitchButton';
import ImageUpload from '@/components/shared ui/ImageUpload';
import Toast from '@/components/shared ui/Toast';

import { GoCheck } from 'react-icons/go';
import { RxCross2 } from 'react-icons/rx';
import { ImSpinner2 } from 'react-icons/im';

import { createProductAction, updateProductAction } from '@/actions/product.actions';
import { deleteImageAction } from '@/actions/upload.actions';
import { uploadFiles } from '@/lib/uploadthing';
import { Product, Category, ProductFormValues } from '@/types/products.types';

interface ProductFormProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  product?: Product | null;
  categories: Category[];
  onSuccess?: () => void;
}



const initialValues: ProductFormValues = {
  categoryId: 0,
  itemName: '',
  imageUrl: '',
  genericName: '',
  brand: '',
  strength: '',
  tabletsPerStrip: null,
  unitPerBox: null,
  baseUnit: '',
  rackLocation: '',
  lowStockThreshold: 0,
  pricePerUnit: null,
  sellingPrice: 0,
  status: 'ACTIVE',
};

export default function ProductForm({
  open,
  setOpen,
  product,
  categories,
  onSuccess,
}: ProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'fail';
  } | null>(null);

  // Ensure categoryId defaults to first category if no product exists
  const defaultValues: ProductFormValues = product
    ? { ...product }
    : { ...initialValues, categoryId: categories[0]?.id || 0 };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm<ProductFormValues>({
    defaultValues,
  });

  const categoryOptions =
    categories.length === 0
      ? [{ value: '', label: 'No categories available' }]
      : categories.map(cat => ({ value: String(cat.id), label: cat.name }));

  if (!product && categories.length && defaultValues.categoryId === 0) {
    setValue('categoryId', categories[0].id);
  }

  const onSubmit = async (data: ProductFormValues) => {
    if (!categories.length) {
      setToastMessage({
        message: 'No categories available. Please create a category first.',
        type: 'error',
      });
      return;
    }

    startTransition(async () => {
      try {
        let finalImageUrl = data.imageUrl;

        // 1. Handle Image Upload if a new file is selected
        if (selectedFile) {
          setIsUploading(true);
          try {
            const uploadRes = await uploadFiles("imageUploader", {
              files: [selectedFile],
            });

            if (uploadRes && uploadRes[0]) {
              finalImageUrl = uploadRes[0].url;
            } else {
              throw new Error("Failed to get upload URL");
            }
          } catch (uploadError: any) {
            setToastMessage({
              message: `Image upload failed: ${uploadError.message}`,
              type: 'fail',
            });
            setIsUploading(false);
            return;
          }
          setIsUploading(false);
        }

        // 2. Prepare Form Data
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Use the new image URL if we just uploaded one
            if (key === 'imageUrl') {
              formData.append(key, finalImageUrl || '');
            } else {
              formData.append(key, String(value));
            }
          }
        });

        // 3. Save Product
        const result = product?.id
          ? await updateProductAction(product.id.toString(), formData)
          : await createProductAction(formData);

        if (result?.success) {
          // 4. Cleanup old image if it was replaced
          if (product?.imageUrl && product.imageUrl !== finalImageUrl) {
            await deleteImageAction(product.imageUrl);
          }

          setToastMessage({
            message: result.message || 'Product saved successfully',
            type: 'success',
          });

          reset({ ...initialValues, categoryId: categories[0]?.id || 0 });
          setSelectedFile(null);
          setOpen(false);
          onSuccess?.();
        } else {
          // If product save failed but image was uploaded, we might have an orphan image. 
          // For now, we prioritize user feedback.
          setToastMessage({
            message: result?.error || result?.message || 'Something went wrong',
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

  return (
    <>
      <SideDrawerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={product ? 'Update Product' : 'Add Product'}
        footerButtons={
          <>
            <Button onClick={() => setOpen(false)} variant="secondary" leftIcon={<RxCross2 />}>
              Cancel
            </Button>

            <Button
              form="productForm"
              type="submit"
              variant="primary"
              leftIcon={isPending ? <ImSpinner2 className="animate-spin" /> : <GoCheck />}
              disabled={isPending}
            >
              {isPending ? (product ? 'Updating' : 'Creating') : product ? 'Update Product' : 'Add Product'}
            </Button>
          </>
        }
      >
        <form id="productForm" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <CustomInput
            label="Product Name"
            placeholder="Napa"
            {...register('itemName', { required: 'Required' })}
            error={errors.itemName?.message}
          />

          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Generic Name" placeholder="Paracetamol" {...register('genericName')} />
            <CustomInput label="Brand" placeholder="Beximo" {...register('brand')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CustomSelector
              label="Category"
              options={categoryOptions}
              {...register('categoryId', { valueAsNumber: true, required: 'Required' })}
              error={errors.categoryId?.message}
            />
            <CustomInput label="Strength" placeholder="500 mg" {...register('strength')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CustomInput label="Base Unit" placeholder="Strip" {...register('baseUnit')} />
            <CustomInput
              label="Tablets Per Strip (Optional)"
              type="number"
              placeholder="10"
              {...register('tabletsPerStrip', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              label="Units Per Box (Optional)"
              type="number"
              placeholder="10"
              {...register('unitPerBox', { valueAsNumber: true })}
            />
            <CustomInput label="Rack Location" placeholder="A1" {...register('rackLocation')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              label="Low Stock Threshold"
              type="number"
              placeholder="20"
              {...register('lowStockThreshold', { valueAsNumber: true })}
            />
            <CustomInput
              label="Price Per Unit (Optional)"
              type="number"
              placeholder="0.01"
              step="0.01"
              {...register('pricePerUnit', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <CustomInput
              label="Selling Price"
              type="number"
              placeholder="20"
              step="0.01"
              {...register('sellingPrice', { valueAsNumber: true, required: 'Required' })}
              error={errors.sellingPrice?.message}
            />
          </div>

          <div className="w-full">
            <label className="block text-gray-700 mb-1 text-[14px] font-medium">
              Mark Product Active/Inactive
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

          <ImageUpload
            label="Product Image"
            initialImage={watch('imageUrl')}
            onFileSelect={(file) => {
              setSelectedFile(file);
              if (!file) setValue('imageUrl', '');
            }}
            isUploading={isUploading}
          />
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
