"use client";

import React, { useState, useTransition, useEffect } from "react";
import ViewButton from "@/components/shared ui/ViewButton";
import ReturnButton from "@/components/shared ui/ReturnButton";
import BackToInventoryButton from "@/components/shared ui/BackToInventoryButton";
import ConfirmModal from "@/components/shared ui/ConfirmModal";
import CenteredModal from "@/components/shared ui/CenteredModal";
import ReturnForm from "./ReturnForm";
import SingleOrder from "./SingleOrder";
import { Sale } from "@/types/sale.types";
import { backToInventoryAction } from "@/actions/sale.actions";

interface SaleActionProps {
  sale: Sale;
}

export default function SaleAction({ sale }: SaleActionProps) {
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isRestoredToInventory, setIsRestoredToInventory] = useState(false);

  // Check if sale has been restored to inventory
  useEffect(() => {
    const checkInventoryStatus = async () => {
      if (sale.status === "RETURNED") {
        try {
          const response = await fetch(`/api/admin/sales/${sale.id}/inventory-status`);
          if (response.ok) {
            const data = await response.json();
            setIsRestoredToInventory(data.isRestored);
          }
        } catch (error) {
          console.error("Error checking inventory status:", error);
        }
      }
    };

    checkInventoryStatus();
  }, [sale.id, sale.status]);

  const handleReturnClick = () => {
    if (sale.status === "RETURNED") return;
    setIsReturnFormOpen(true);
  };

  const handleBackToInventoryClick = () => {
    if (sale.status !== "RETURNED" || isRestoredToInventory) return;
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBackToInventory = () => {
    setIsConfirmModalOpen(false);
    
    startTransition(async () => {
      try {
        const result = await backToInventoryAction(sale.id);
        
        if (result.success) {
          setIsRestoredToInventory(true);
          // No alert - just silently update the status
        } else {
          alert(result.error || result.message);
        }
      } catch (error: any) {
        alert(error.message || "Failed to restore items to inventory.");
      }
    });
  };

  const handleReturnSuccess = () => {
    startTransition(() => {
      // The form will handle the API call and page refresh
      // This is just for any additional logic if needed
    });
  };

  const handleView = () => {
    setIsOrderModalOpen(true);
  };

  const handleViewReason = () => {
    setIsReasonModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <ViewButton onClick={handleView} />
        
        {sale.status === "COMPLETED" && (
          <ReturnButton 
            ariaLabel="return"
            onClick={handleReturnClick}
            disabled={isPending}
          />
        )}

        {sale.status === "RETURNED" && !isRestoredToInventory && (
          <BackToInventoryButton 
            ariaLabel="back-to-inventory"
            onClick={handleBackToInventoryClick}
            disabled={isPending}
            title="Restore items back to inventory"
          />
        )}   
      </div>

      <SingleOrder
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        sale={sale}
      />

      <ReturnForm
        isOpen={isReturnFormOpen}
        onClose={() => setIsReturnFormOpen(false)}
        sale={sale}
        onSuccess={handleReturnSuccess}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmBackToInventory}
        title="Restore to Inventory"
        message="Are you sure you want to restore these items back to inventory? This will add the quantities back to their original batches."
      />
      
    </>
  );
}