'use client';

import React, { useState, useTransition } from 'react';
import EditButton from '@/components/shared ui/EditButton';
import DeleteButton from '@/components/shared ui/DeleteButton';
import Button from '@/components/shared ui/Button';
import PurchaseForm from './PurchaseForm';
import ConfirmModal from '@/components/shared ui/ConfirmModal';
import Toast from '@/components/shared ui/Toast';

import { GoPackage } from 'react-icons/go';
import { ImSpinner2 } from 'react-icons/im';


import {
  deletePurchaseOrderAction,
  updatePurchaseOrderStatusAction,
} from '@/actions/purchase.actions';



import { PurchaseOrder } from '@/types/purchase.types';

interface PurchaseActionProps {
  purchase: PurchaseOrder;
}

function PurchaseAction({ purchase }: PurchaseActionProps) {
  const [isUpdatingStatus, startStatusTransition] = useTransition();

  const [openEditForm, setOpenEditForm] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'fail';
  } | null>(null);

  /* Delete Purchase List */
  const handleDelete = async () => {
    try {
      const result = await deletePurchaseOrderAction(purchase.id);

      if (result?.success) {
        setToastMessage({
          message: result.message || 'Purchase order deleted successfully',
          type: 'success',
        });
        setOpenDeleteModal(false);
        // No need to reload - revalidation handles the update
      } else {
        setToastMessage({
          message: result?.error || 'Failed to delete purchase order',
          type: 'fail',
        });
        throw new Error(result?.error || 'Failed to delete purchase order');
      }
    } catch (error: any) {
      setToastMessage({
        message: error.message || 'Something went wrong',
        type: 'fail',
      });
      throw error;
    }
  };

  /*  Mark Order  */
  const handleOrder = () => {
    if (purchase.status !== 'LISTED') return;

    startStatusTransition(async () => {
      try {
        const result = await updatePurchaseOrderStatusAction(
          purchase.id,
          'ORDERED'
        );

        if (result?.success) {
          setToastMessage({
            message: result.message || 'Purchase order marked as ordered',
            type: 'success',
          });
          // No need to reload - revalidation handles the update
        } else {
          setToastMessage({
            message: result?.error || 'Failed to update purchase order status',
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
    <div className="flex gap-2">
      {/* Edit Button */}
      <EditButton
        variant="secondary"
        onClick={() => setOpenEditForm(true)}
        ariaLabel="Edit Purchase Order"
        disabled={purchase.status === 'RECEIVED' || isUpdatingStatus}
      />

      {/* Delete Button */}
      <DeleteButton
        onClick={() => setOpenDeleteModal(true)}
        ariaLabel="Delete Purchase Order"
        disabled={purchase.status !== 'LISTED' || isUpdatingStatus}
      />

      {/* Order Button with Loading */}
      <Button
        variant={purchase.status === 'LISTED' ? 'primary' : 'secondary'}
        onClick={handleOrder}
        disabled={purchase.status !== 'LISTED' || isUpdatingStatus}
        leftIcon={
          isUpdatingStatus ? (
            <ImSpinner2 className="animate-spin w-4 h-4" />
          ) : (
            <GoPackage className="w-4 h-4" />
          )
        }
      >
        {isUpdatingStatus
          ? 'Processing'
          : purchase.status === 'LISTED'
          ? 'Mark Order'
          : 'Ordered'}
      </Button>

      {/* Edit Form */}
      <PurchaseForm
        open={openEditForm}
        setOpen={setOpenEditForm}
        purchase={purchase}        
        // onSuccess={() => window.location.reload()}
         
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={openDeleteModal}
        title="Delete Purchase Order"
        message="Are you sure you want to delete this purchase order?"
        onConfirm={handleDelete}
        onCancel={() => setOpenDeleteModal(false)}
      />

      {/* Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}

export default PurchaseAction;









