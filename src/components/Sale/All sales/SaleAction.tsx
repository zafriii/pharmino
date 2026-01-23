"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import ViewButton from "@/components/shared ui/ViewButton";
import ReturnButton from "@/components/shared ui/ReturnButton";
import BackToInventoryButton from "@/components/shared ui/BackToInventoryButton";
import ConfirmModal from "@/components/shared ui/ConfirmModal";
import ReturnForm from "./ReturnForm";
import SingleOrder from "./SingleOrder";
import Button from "@/components/shared ui/Button";
import Invoice from "./Invoice";
import { Sale } from "@/types/sale.types";
import { backToInventoryAction } from "@/actions/sale.actions";
import { HiOutlinePrinter } from "react-icons/hi2";

interface SaleActionProps {
  sale: Sale;
}

export default function SaleAction({ sale }: SaleActionProps) {
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isRestoredToInventory, setIsRestoredToInventory] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Check if sale has been restored to inventory
  useEffect(() => {
    const checkInventoryStatus = async () => {
      if (sale.status === "RETURNED") {
        try {
          const response = await fetch(`/api/sales/${sale.id}/inventory-status`);
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

  const handlePrintInvoice = () => {
    if (!printRef.current) return;

    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups to print the invoice');
      return;
    }

    // Get the invoice HTML
    const invoiceHTML = printRef.current.innerHTML;
    
    // Write complete HTML document
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${sale.id}</title>
          <meta charset="utf-8">
          <style>
            @page {
              margin: 0;
              size: auto;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 20px;
              }
              
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body>
          ${invoiceHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 200);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
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

        <Button
          variant="primary"
          onClick={handlePrintInvoice}
          className="w-auto! px-4 py-1.5 text-xs"
          leftIcon={<HiOutlinePrinter className="w-4 h-4" />}
        >
          Invoice
        </Button>  
      </div>

      {/* Hidden Invoice for Printing */}
      <div ref={printRef} className="hidden">
        <Invoice sale={sale} />
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
