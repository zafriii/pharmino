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
  
  // Use the actual server data directly instead of local state
  const isProcessed = receivedItem.isFullyProcessed;
  const canAdd = receivedItem.canAddToInventory;
  const remaining = receivedItem.remainingQuantity;

  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'fail';
  } | null>(null);

  const handleSuccessfulAddition = () => {
    setToastMessage({
      message: 'Item successfully added to inventory',
      type: 'success',
    });
    
    // Close the form
    setOpenInventoryForm(false);
  };

  return (
    <div className="flex gap-2">
      {canAdd && remaining > 0 && !isProcessed ? (
        <Button
          variant="primary"
          leftIcon={<MdOutlineInventory2 className="w-4 h-4" />}
          onClick={() => {
            // Double-check before opening the form
            if (receivedItem.canAddToInventory && receivedItem.remainingQuantity > 0 && !receivedItem.isFullyProcessed) {
              setOpenInventoryForm(true);
            } else {
              setToastMessage({
                message: 'This item has already been fully added to inventory.',
                type: 'error',
              });
            }
          }}
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
      {canAdd && remaining > 0 && !isProcessed && (
        <SingleItemInventoryForm
          open={openInventoryForm}
          setOpen={setOpenInventoryForm}
          receivedItem={receivedItem}
          onSuccess={handleSuccessfulAddition}
        />
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

export default ReceivedProductAction;