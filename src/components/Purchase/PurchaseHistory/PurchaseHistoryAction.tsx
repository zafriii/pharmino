'use client';

import React, { useState, useTransition } from 'react';
import Button from '@/components/shared ui/Button';
import Toast from '@/components/shared ui/Toast';

import { GoPackage } from 'react-icons/go';
import { RiCheckboxCircleFill } from "react-icons/ri";
import { ImSpinner2 } from 'react-icons/im';
import { updatePurchaseOrderStatusAction } from '@/actions/purchase.actions';
import { PurchaseOrder } from '@/types/purchase.types';

interface PurchaseHistoryActionProps {
  purchase: PurchaseOrder;
  tab: 'ordered' | 'received';
}

function PurchaseHistoryAction({ purchase, tab }: PurchaseHistoryActionProps) {
  const [isPending, startTransition] = useTransition();

  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'fail';
  } | null>(null);

  const handleReceive = () => {
    startTransition(async () => {
      try {
        const result = await updatePurchaseOrderStatusAction(purchase.id, 'RECEIVED');
        
        if (result?.success) {
          setToastMessage({
            message: result.message || 'Purchase order marked as received',
            type: 'success',
          });
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
      {/* Receive Button - Only show for ordered items */}
      {tab === 'ordered' && purchase.status === 'ORDERED' && (
        <Button
          variant="primary"

          // leftIcon={<GoCheck className="w-4 h-4" />}
          leftIcon={
                  isPending ? (
                  <ImSpinner2 className="animate-spin w-4 h-4" />
                  ) : (
                  <RiCheckboxCircleFill className="w-4 h-4" />
                  )
                  }
         
          onClick={handleReceive}
          disabled={isPending}
        >
          {isPending ? 'Processing' : 'Mark Receive'}
        </Button>
      )}

      {/* Status indicator for received items */}
      {tab === 'received' && purchase.status === 'RECEIVED' && (
        <Button
          variant="secondary"
          leftIcon={<GoPackage className="w-4 h-4" />}
          disabled
        >
          Received
        </Button>
      )}

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

export default PurchaseHistoryAction;