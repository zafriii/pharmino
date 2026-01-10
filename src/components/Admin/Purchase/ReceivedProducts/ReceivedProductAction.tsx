'use client';

import React, { useState, useEffect} from 'react';
import Button from '@/components/shared ui/Button';
import Toast from '@/components/shared ui/Toast';
import SingleItemInventoryForm from '../../Inventory/SingleItemInventoryForm';
import { ReceivedItem } from '@/types/receivedProducts.types';

import { MdOutlineInventory2 } from "react-icons/md";
import { GoPackage } from 'react-icons/go';

interface ReceivedProductActionProps {
  receivedItem: ReceivedItem;
}

function ReceivedProductAction({ receivedItem }: ReceivedProductActionProps) {
  const [openInventoryForm, setOpenInventoryForm] = useState(false);
  const [isProcessed, setIsProcessed] = useState(receivedItem.isFullyProcessed);
  const [canAdd, setCanAdd] = useState(receivedItem.canAddToInventory);
  const [remaining, setRemaining] = useState(receivedItem.remainingQuantity);

  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'fail';
  } | null>(null);

  // Update local state when receivedItem prop changes
  useEffect(() => {
    setIsProcessed(receivedItem.isFullyProcessed);
    setCanAdd(receivedItem.canAddToInventory);
    setRemaining(receivedItem.remainingQuantity);
  }, [receivedItem.isFullyProcessed, receivedItem.canAddToInventory, receivedItem.remainingQuantity]);

  const handleSuccessfulAddition = () => {
    // Update local state to reflect the change immediately
    setIsProcessed(true);
    setCanAdd(false);
    setRemaining(0);
    
    setToastMessage({
      message: 'Item successfully added to inventory',
      type: 'success',
    });
  };

  return (
    <div className="flex gap-2">
      {canAdd && remaining > 0 && !isProcessed ? (
        <Button
          variant="primary"
          leftIcon={<MdOutlineInventory2 className="w-4 h-4" />}
          onClick={() => setOpenInventoryForm(true)}
        >
          Add to Inventory
        </Button>
      ) : (
        <Button
          variant="secondary"
          leftIcon={<GoPackage className="w-4 h-4" />}
          disabled
        >
          {isProcessed ? 'Added to Inventory' : 'Processing'}
        </Button>
      )}

      {/* Single Item Inventory Form Modal */}
      <SingleItemInventoryForm
        open={openInventoryForm}
        setOpen={setOpenInventoryForm}
        receivedItem={receivedItem}
        onSuccess={handleSuccessfulAddition}
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

export default ReceivedProductAction;