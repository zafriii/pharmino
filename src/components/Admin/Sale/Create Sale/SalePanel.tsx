// "use client";

// import React, { useState, useRef, useEffect } from "react";
// import { SaleItem } from "@/types/sale.types";
// import { useSaleStore } from "@/stores/saleStore";
// import { useSaleContext } from "@/contexts/SaleContext";
// import { createSaleAction } from "@/actions/sale.actions";
// import Button from "@/components/shared ui/Button";
// import Toast from "@/components/shared ui/Toast";
// import { GiMedicines } from "react-icons/gi";
// import TabletSellSection from "@/components/Admin/Sale/Create Sale/TabletSellSection";
// import { TabletSaleConfig } from "@/types/tablet-sale.types";


// const SalePanel: React.FC = () => {
//   const { 
//     selectedProducts, 
//     isCreatingSale, 
//     toast,
//     updateQuantity, 
//     removeProduct, 
//     clearSale, 
//     setCreatingSale,
//     showToast,
//     hideToast
//   } = useSaleStore();

//   const { getAvailableStock, getProductById } = useSaleContext();

//   const [discountAmount, setDiscountAmount] = useState<number>(0);
//   const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
//   const [tabletConfigs, setTabletConfigs] = useState<Record<number, TabletSaleConfig>>({});
//   const isProcessingRef = useRef<boolean>(false);

 
//   // Calculate subtotal
//   const subtotal = selectedProducts.reduce((sum, item) => {
//     const price = typeof item.totalPrice === 'number' ? item.totalPrice : 0;
//     return sum + price;
//   }, 0);
//   const grandTotal = Math.max(0, subtotal - discountAmount);

//   const handleQuantityChange = (item: SaleItem, newQuantity: number) => {
//     // Check if product has active batches before allowing quantity changes
//     if (!hasActiveBatchesAvailable(item)) {
//       showToast(`Cannot modify quantity: ${item.item?.itemName || 'Product'} has no active non-expired batches available`, 'error');
//       return;
//     }

//     if (newQuantity <= 0) {
//       removeProduct(item.itemId);
//       // Also remove tablet config
//       const newConfigs = { ...tabletConfigs };
//       delete newConfigs[item.itemId];
//       setTabletConfigs(newConfigs);
//       showToast(`${item.item?.itemName || 'Product'} removed from sale`);
//       return;
//     }

//     // Check if this is a tablet sale (either via config or direct sell type)
//     const tabletConfig = tabletConfigs[item.itemId];
//     const isTabletSaleViaConfig = tabletConfig?.enabled && item.item?.tabletsPerStrip && item.item?.pricePerUnit;
//     const isTabletSaleViaSellType = item.sellType === "SINGLE_TABLET" && item.item?.tabletsPerStrip;

//     if (isTabletSaleViaConfig) {
//       // For tablet sales via config, update the tablet config
//       const availableTablets = getAvailableTabletsForProduct(item);
//       if (newQuantity > availableTablets) {
//         showToast(`Cannot set quantity to ${newQuantity}. Only ${availableTablets} tablets available`, 'error');
//         return;
//       }
      
//       handleTabletConfigChange(item.itemId, {
//         enabled: true,
//         quantity: newQuantity
//       });
//       return;
//     } else if (isTabletSaleViaSellType) {
//       // For tablet sales via sell type, validate against tablet limits
//       const availableTablets = getAvailableTabletsForProduct(item);
//       if (newQuantity > availableTablets) {
//         showToast(`Cannot set quantity to ${newQuantity}. Only ${availableTablets} tablets available`, 'error');
//         return;
//       }
      
//       updateQuantity(item.itemId, newQuantity, "SINGLE_TABLET");
//       return;
//     }

//     // Regular quantity change logic for strips/units
//     let availableStock = 0;
//     if (item.item?.batches) {
//       item.item.batches.forEach((batch: any) => {
//         if (batch.status === "ACTIVE" && batch.quantity > 0) {
//           // Check if batch is not expired
//           let isNotExpired = true;
//           if (batch.expiryDate) {
//             const currentDate = new Date();
//             currentDate.setHours(0, 0, 0, 0);
//             const expiryDate = new Date(batch.expiryDate);
//             expiryDate.setHours(0, 0, 0, 0);
//             isNotExpired = expiryDate > currentDate;
//           }
          
//           if (isNotExpired) {
//             availableStock += batch.quantity;
//           }
//         }
//       });
//     }
    
//     const otherSelectedQuantity = selectedProducts
//       .filter(p => p.itemId !== item.itemId)
//       .reduce((sum, p) => p.itemId === item.itemId ? sum + p.quantity : sum, 0);
    
//     const maxAllowedQuantity = availableStock - otherSelectedQuantity;
    
//     if (newQuantity > maxAllowedQuantity) {
//       showToast(`Cannot set quantity to ${newQuantity}. Only ${maxAllowedQuantity} available in stock`, 'error');
//       return;
//     }

//     updateQuantity(item.itemId, Math.max(1, newQuantity), item.sellType);
//   };

//   const handleTabletConfigChange = (itemId: number, config: TabletSaleConfig) => {
//     // Find the item to check batch status
//     const item = selectedProducts.find(p => p.itemId === itemId);
//     if (item && !hasActiveBatchesAvailable(item)) {
//       showToast(`Cannot modify tablet configuration: ${item.item?.itemName || 'Product'} has no active non-expired batches available`, 'error');
//       return;
//     }

//     const newConfigs = { ...tabletConfigs, [itemId]: config };
//     setTabletConfigs(newConfigs);

//     // Update the sale item with tablet pricing
//     const product = getProductById(itemId);
//     if (product && config.enabled && config.quantity > 0) {
//       updateQuantity(itemId, config.quantity, "SINGLE_TABLET");
//     } else if (!config.enabled) {
//       // Switch back to regular sale
//       updateQuantity(itemId, 1, "FULL_STRIP");
//     }
//   };

//   const isInTabletMode = (item: SaleItem): boolean => {
//     return Boolean(tabletConfigs[item.itemId]?.enabled) || 
//            Boolean(item.sellType === "SINGLE_TABLET" && item.item?.tabletsPerStrip);
//   };

//   // Check if product has complete strips available (not just remaining tablets)
//   const hasCompleteStripsAvailable = (item: SaleItem): boolean => {
//     if (!item.item?.batches || !item.item?.tabletsPerStrip) return false;
    
//     return item.item.batches.some((batch: any) => {
//       const hasStock = batch.quantity > 0 && batch.status === "ACTIVE";
//       if (!hasStock) return false;
      
//       // Check if batch is not expired
//       if (!batch.expiryDate) return true; // No expiry date means it doesn't expire
//       const currentDate = new Date();
//       currentDate.setHours(0, 0, 0, 0);
//       const expiryDate = new Date(batch.expiryDate);
//       expiryDate.setHours(0, 0, 0, 0);
//       return expiryDate > currentDate;
//     });
//   };

//   // Check if product has active batches available for selling
//   const hasActiveBatchesAvailable = (item: SaleItem): boolean => {
//     if (!item.item?.batches) return false;
    
//     return item.item.batches.some((batch: any) => {
//       // Check if batch is active and has stock
//       const isActiveWithStock = batch.status === "ACTIVE" && (batch.quantity > 0 || (batch.remainingTablets && batch.remainingTablets > 0));
      
//       if (!isActiveWithStock) return false;
      
//       // Check if batch is not expired
//       if (!batch.expiryDate) return true; // No expiry date means it doesn't expire
//       const currentDate = new Date();
//       currentDate.setHours(0, 0, 0, 0);
//       const expiryDate = new Date(batch.expiryDate);
//       expiryDate.setHours(0, 0, 0, 0);
//       return expiryDate > currentDate;
//     });
//   };

//   // Check if product has only remaining tablets (no complete strips)
//   const hasOnlyRemainingTablets = (item: SaleItem): boolean => {
//     if (!item.item?.batches || !item.item?.tabletsPerStrip) return false;
    
//     const hasActiveCompleteStrips = item.item.batches.some((batch: any) => {
//       const hasStock = batch.quantity > 0 && batch.status === "ACTIVE";
//       if (!hasStock) return false;
      
//       // Check if batch is not expired
//       if (!batch.expiryDate) return true; // No expiry date means it doesn't expire
//       const currentDate = new Date();
//       currentDate.setHours(0, 0, 0, 0);
//       const expiryDate = new Date(batch.expiryDate);
//       expiryDate.setHours(0, 0, 0, 0);
//       return expiryDate > currentDate;
//     });
    
//     const hasActivePartialTablets = item.item.batches.some((batch: any) => {
//       const hasTablets = (batch.remainingTablets || 0) > 0 && batch.status === "ACTIVE";
//       if (!hasTablets) return false;
      
//       // Check if batch is not expired
//       if (!batch.expiryDate) return true; // No expiry date means it doesn't expire
//       const currentDate = new Date();
//       currentDate.setHours(0, 0, 0, 0);
//       const expiryDate = new Date(batch.expiryDate);
//       expiryDate.setHours(0, 0, 0, 0);
//       return expiryDate > currentDate;
//     });
    
//     return !hasActiveCompleteStrips && hasActivePartialTablets;
//   };

//   const getCurrentQuantity = (item: SaleItem): number => {
//     if (tabletConfigs[item.itemId]?.enabled) {
//       return tabletConfigs[item.itemId].quantity;
//     }
//     return item.quantity;
//   };

//   const getMaxQuantityForCurrentMode = (item: SaleItem): number => {
//     if (isInTabletMode(item)) {
//       return getAvailableTabletsForProduct(item);
//     }
//     return getMaxQuantityForItem(item);
//   };

//   const getAvailableTabletsForProduct = (item: SaleItem): number => {
//     if (!item.item?.tabletsPerStrip || !item.item?.batches) return 0;
    
//     // Calculate available tablets from ACTIVE and non-expired batches only
//     let totalTablets = 0;
//     item.item.batches.forEach((batch: any) => {
//       if (batch.status === "ACTIVE") {
//         // Check if batch is not expired
//         let isNotExpired = true;
//         if (batch.expiryDate) {
//           const currentDate = new Date();
//           currentDate.setHours(0, 0, 0, 0);
//           const expiryDate = new Date(batch.expiryDate);
//           expiryDate.setHours(0, 0, 0, 0);
//           isNotExpired = expiryDate > currentDate;
//         }
        
//         if (isNotExpired) {
//           // Add complete strips as tablets
//           if (batch.quantity > 0 && item.item?.tabletsPerStrip) {
//             totalTablets += batch.quantity * item.item.tabletsPerStrip;
//           }
//           // Add remaining tablets
//           if (batch.remainingTablets > 0) {
//             totalTablets += batch.remainingTablets;
//           }
//         }
//       }
//     });
    
//     return totalTablets;
//   };

//   const getMaxQuantityForItem = (item: SaleItem) => {
//     // Get available stock from ACTIVE and non-expired batches only
//     let availableStock = 0;
//     if (item.item?.batches) {
//       item.item.batches.forEach((batch: any) => {
//         if (batch.status === "ACTIVE" && batch.quantity > 0) {
//           // Check if batch is not expired
//           let isNotExpired = true;
//           if (batch.expiryDate) {
//             const currentDate = new Date();
//             currentDate.setHours(0, 0, 0, 0);
//             const expiryDate = new Date(batch.expiryDate);
//             expiryDate.setHours(0, 0, 0, 0);
//             isNotExpired = expiryDate > currentDate;
//           }
          
//           if (isNotExpired) {
//             availableStock += batch.quantity;
//           }
//         }
//       });
//     }
    
//     const otherSelectedQuantity = selectedProducts
//       .filter(p => p.itemId !== item.itemId)
//       .reduce((sum, p) => p.itemId === item.itemId ? sum + p.quantity : sum, 0);
    
//     return availableStock - otherSelectedQuantity;
//   };

//   const handleSellTypeChange = (item: SaleItem, sellType: "FULL_STRIP" | "SINGLE_TABLET" | "ML") => {
//     console.log("handleSellTypeChange called:", { itemId: item.itemId, sellType, currentSellType: item.sellType });
    
//     // Check if product has active batches before allowing sell type changes
//     if (!hasActiveBatchesAvailable(item)) {
//       showToast(`Cannot change sell type: ${item.item?.itemName || 'Product'} has no active non-expired batches available`, 'error');
//       return;
//     }
    
//     // If trying to select FULL_STRIP but only tablets are available, force SINGLE_TABLET
//     if (sellType === "FULL_STRIP" && hasOnlyRemainingTablets(item)) {
//       console.log("Forcing SINGLE_TABLET mode - only remaining tablets available");
//       sellType = "SINGLE_TABLET";
//       showToast("Only individual tablets available for this product", 'info' as any);
//     }
    
//     if (sellType === "SINGLE_TABLET" && item.item?.tabletsPerStrip) {
//       // Check if product has pricePerUnit for enhanced tablet config
//       if (item.item?.pricePerUnit) {
//         console.log("Using enhanced tablet config mode");
//         // Enable tablet config when switching to SINGLE_TABLET (enhanced mode)
//         const availableTablets = getAvailableTabletsForProduct(item);
//         const tabletQuantity = Math.min(item.quantity, availableTablets);
        
//         handleTabletConfigChange(item.itemId, {
//           enabled: true,
//           quantity: tabletQuantity
//         });
//       } else {
//         console.log("Using basic tablet mode");
//         // Basic tablet mode without enhanced config
//         // Convert current strip quantity to tablet quantity for initial value
//         const tabletQuantity = item.item.tabletsPerStrip ? item.quantity * item.item.tabletsPerStrip : item.quantity;
//         console.log("Converting strips to tablets:", { strips: item.quantity, tablets: tabletQuantity });
//         updateQuantity(item.itemId, tabletQuantity, sellType);
//       }
//     } else if (sellType === "FULL_STRIP") {
//       console.log("Switching to strip mode");
//       // Disable tablet config when switching to FULL_STRIP
//       handleTabletConfigChange(item.itemId, {
//         enabled: false,
//         quantity: 0
//       });
//     } else {
//       console.log("Using regular sell type:", sellType);
//       // For other sell types, just update normally
//       updateQuantity(item.itemId, item.quantity, sellType);
//     }
//   };

//   // Auto-select appropriate sell type based on available stock (only for initial setup)
//   useEffect(() => {
//     selectedProducts.forEach(item => {
//       if (item.item?.tabletsPerStrip) {
//         const hasCompleteStrips = hasCompleteStripsAvailable(item);
//         const hasOnlyTablets = hasOnlyRemainingTablets(item);
        
//         // Only auto-select if no sell type is set yet or if forced by stock constraints
//         if (hasOnlyTablets && item.sellType !== "SINGLE_TABLET") {
//           console.log("Auto-selecting SINGLE_TABLET for product with only remaining tablets:", item.item.itemName);
//           handleSellTypeChange(item, "SINGLE_TABLET");
//         } else if (hasCompleteStrips && !item.sellType) {
//           // Only set default to FULL_STRIP if no sell type is set yet
//           console.log("Setting default FULL_STRIP for product with complete strips available:", item.item.itemName);
//           updateQuantity(item.itemId, item.quantity, "FULL_STRIP");
//         }
//       }
//     });
//   }, [selectedProducts.length]); // Only run when products are added/removed, not on every change

//   const handleRemoveProduct = (item: SaleItem) => {
//     removeProduct(item.itemId);
//     // Also remove tablet config when removing product
//     const newConfigs = { ...tabletConfigs };
//     delete newConfigs[item.itemId];
//     setTabletConfigs(newConfigs);
//     showToast(`${item.item?.itemName || 'Product'} removed from sale`);
//   };

//   const handleConfirmSale = async () => {
//     // Prevent multiple simultaneous calls
//     if (selectedProducts.length === 0 || isCreatingSale || isProcessingRef.current) {
//       return;
//     }

//     // Check if all selected products have active batches
//     const productsWithInactiveBatches = selectedProducts.filter(item => !hasActiveBatchesAvailable(item));
//     if (productsWithInactiveBatches.length > 0) {
//       const productNames = productsWithInactiveBatches.map(item => item.item?.itemName).join(', ');
//       showToast(`Cannot complete sale: ${productNames} have no active non-expired batches available`, 'error');
//       return;
//     }

//     // Set both state and ref to prevent double clicks
//     isProcessingRef.current = true;
//     setCreatingSale(true);
    
//     try {
//       console.log("Creating sale with data:", {
//         itemCount: selectedProducts.length,
//         grandTotal,
//         paymentMethod,
//         items: selectedProducts.map(item => ({
//           itemId: item.itemId,
//           sellType: item.sellType,
//           quantity: item.quantity,
//           unitPrice: Number(item.unitPrice),
//           totalPrice: Number(item.totalPrice)
//         }))
//       });

//       const result = await createSaleAction({
//         customerId: null, // No customer for now
//         subtotal,
//         discountAmount,
//         grandTotal,
//         paymentMethod,
//         items: selectedProducts.map(item => ({
//           itemId: item.itemId,
//           sellType: item.sellType,
//           quantity: item.quantity,
//           unitPrice: Number(item.unitPrice),
//           totalPrice: Number(item.totalPrice)
//         }))
//       });

//       console.log("Sale creation result:", result);
      
//       // Log debugging info if available
//       if (result.data?.debugInfo) {
//         console.log("API Debugging Info:", result.data.debugInfo);
//       }

//       if (result.success) {
//         showToast("Sale created successfully!");
//         clearSale(); // Clear the sale
//         setDiscountAmount(0);
//         setPaymentMethod("CASH");
//         setTabletConfigs({}); // Clear tablet configs
//       } else {
//         console.error("Sale creation failed:", result.error);
//         showToast(result.error || "Failed to create sale", 'error');
//       }
//     } catch (error) {
//       console.error("Sale creation error:", error);
//       showToast("Failed to create sale. Please try again.", 'error');
//     } finally {
//       // Reset both state and ref with a small delay to prevent rapid successive clicks
//       setTimeout(() => {
//         setCreatingSale(false);
//         isProcessingRef.current = false;
//       }, 500); // Increased delay to 500ms
//     }
//   };

//   const handleClearSale = () => {
//     clearSale();
//     setDiscountAmount(0);
//     setPaymentMethod("CASH");
//     setTabletConfigs({});
//     showToast("Sale cleared");
//   };

//   if (selectedProducts.length === 0) {
//     return (
//       <>
//         <div className="flex flex-col items-center justify-center py-12 text-gray-500">
//           <div className="text-6xl mb-4"> <GiMedicines/></div>
//           <h3 className="text-lg font-medium mb-2">No Items Selected</h3>
//           <p className="text-sm text-center">
//             Select products from the left panel to add them to the sale.
//           </p>
//         </div>
        
//         {/* Toast */}
//         {toast.show && (
//           <Toast
//             message={toast.message}
//             type={toast.type}
//             onClose={hideToast}
//           />
//         )}
//       </>
//     );
//   }

//   return (
//     <>
//       <div className="space-y-4">
//         {/* Selected Products */}
//         <div className="space-y-3 max-h-96 overflow-y-auto">
//           {selectedProducts.map((item) => (
//             <div key={item.itemId} className={`border rounded-lg p-4 ${
//               !hasActiveBatchesAvailable(item) 
//                 ? "border-red-200 bg-red-50" 
//                 : "border-gray-200 bg-gray-50"
//             }`}>
//               <div className="flex justify-between items-start mb-3">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2">
//                     <h4 className="font-medium text-gray-900 text-sm">
//                       {item.item?.itemName}
//                     </h4>
//                     {!hasActiveBatchesAvailable(item) && (
//                       <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
//                         Inactive/Expired Batch
//                       </span>
//                     )}
//                   </div>
//                   {item.item?.brand && (
//                     <p className="text-xs text-gray-600">{item.item.brand}</p>
//                   )}
//                   {item.item?.strength && (
//                     <p className="text-xs text-gray-500">{item.item.strength}</p>
//                   )}
//                 </div>
//                 <button
//                   onClick={() => handleRemoveProduct(item)}
//                   className="text-red-500 hover:text-red-700 text-sm font-medium"
//                 >
//                   Remove
//                 </button>
//               </div>

//               {/* Tablet Sell Section */}
//               {item.item?.tabletsPerStrip && item.item?.pricePerUnit && (
//                 <div className="mb-3">
//                   <TabletSellSection
//                     product={item.item}
//                     tabletConfig={tabletConfigs[item.itemId] || { enabled: false, quantity: 0 }}
//                     onConfigChange={(config) => handleTabletConfigChange(item.itemId, config)}
//                     availableTablets={getAvailableTabletsForProduct(item)}
//                   />
//                 </div>
//               )}

//               {/* Sell Type Selection for Tablets */}
//               {item.item?.tabletsPerStrip && (
//                 <div className="mb-3">
//                   <label className="block text-xs font-medium text-gray-700 mb-1">
//                     Sell Type:
//                   </label>
//                   <div className="flex gap-2">
//                     {/* Only show Strip option if there are complete strips available */}
//                     {hasCompleteStripsAvailable(item) && (
//                       <button
//                         onClick={() => handleSellTypeChange(item, "FULL_STRIP")}
//                         disabled={!hasActiveBatchesAvailable(item)}
//                         className={`px-3 py-1 text-xs rounded-md border ${
//                           !hasActiveBatchesAvailable(item)
//                             ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
//                             : item.sellType === "FULL_STRIP"
//                             ? "bg-blue-500 text-white border-blue-500"
//                             : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
//                         }`}
//                       >
//                         Strip
//                       </button>
//                     )}
//                     <button
//                       onClick={() => handleSellTypeChange(item, "SINGLE_TABLET")}
//                       disabled={!hasActiveBatchesAvailable(item)}
//                       className={`px-3 py-1 text-xs rounded-md border ${
//                         !hasActiveBatchesAvailable(item)
//                           ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
//                           : item.sellType === "SINGLE_TABLET"
//                           ? "bg-blue-500 text-white border-blue-500"
//                           : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
//                       }`}
//                     >
//                       Tablet
//                     </button>
//                   </div>
//                   {/* Show info message when only tablets are available */}
//                   {hasOnlyRemainingTablets(item) && (
//                     <p className="text-xs text-amber-600 mt-1">
//                       Only individual tablets available (no complete strips)
//                     </p>
//                   )}
//                   {/* Show warning when no active batches are available */}
//                   {!hasActiveBatchesAvailable(item) && (
//                     <p className="text-xs text-red-600 mt-1">
//                       No active non-expired batches available for this product
//                     </p>
//                   )}
//                 </div>
//               )}

//               {/* Quantity Controls */}
//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-2">
//                   <label className="text-xs font-medium text-gray-700">
//                     {isInTabletMode(item) ? 'Tablets:' : 'Qty:'}
//                   </label>
//                   <div className="flex items-center gap-1">
//                     <button
//                       onClick={() => {
//                         const currentQty = getCurrentQuantity(item);
//                         handleQuantityChange(item, currentQty - 1);
//                       }}
//                       disabled={!hasActiveBatchesAvailable(item)}
//                       className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
//                         !hasActiveBatchesAvailable(item)
//                           ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                           : "bg-gray-200 hover:bg-gray-300"
//                       }`}
//                     >
//                       -
//                     </button>
//                     <input
//                       type="number"
//                       value={getCurrentQuantity(item)}
//                       onChange={(e) => handleQuantityChange(item, parseInt(e.target.value) || 1)}
//                       disabled={!hasActiveBatchesAvailable(item)}
//                       className={`w-16 text-center text-sm border border-gray-300 rounded px-2 py-1 ${
//                         !hasActiveBatchesAvailable(item)
//                           ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                           : ""
//                       }`}
//                       min="1"
//                       max={getMaxQuantityForCurrentMode(item)}
//                     />
//                     <button
//                       onClick={() => {
//                         const currentQty = getCurrentQuantity(item);
//                         handleQuantityChange(item, currentQty + 1);
//                       }}
//                       disabled={!hasActiveBatchesAvailable(item) || getCurrentQuantity(item) >= getMaxQuantityForCurrentMode(item)}
//                       className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
//                         !hasActiveBatchesAvailable(item) || getCurrentQuantity(item) >= getMaxQuantityForCurrentMode(item)
//                           ? "bg-gray-100 text-gray-400 cursor-not-allowed"
//                           : "bg-gray-200 hover:bg-gray-300"
//                       }`}
//                     >
//                       +
//                     </button>
//                   </div>
//                   {/* Stock info */}
//                   <span className="text-xs text-gray-500">
//                     {isInTabletMode(item)
//                       ? `(${getAvailableTabletsForProduct(item)} tablets)`
//                       : `(${getMaxQuantityForItem(item)} ${getMaxQuantityForItem(item) > 1 ? "units" : "unit"})`
//                     }
//                   </span>
//                   {/* Batch status warning */}
//                   {!hasActiveBatchesAvailable(item) && (
//                     <span className="text-xs text-red-500 font-medium">
//                       (No active non-expired batches)
//                     </span>
//                   )}
//                 </div>

//                 <div className="text-right">
//                   <div className="text-xs text-gray-600">
//                     {isInTabletMode(item)
//                       ? `${item.unitPrice} × ${getCurrentQuantity(item)} tablets`
//                       : `${item.unitPrice} × ${getCurrentQuantity(item)}`
//                     }
//                   </div>
//                   <div className="text-sm font-semibold text-blue-600">
//                     {(typeof item.totalPrice === 'number' ? item.totalPrice : 0).toFixed(2)}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Sale Summary */}
//         <div className="border-t pt-4 space-y-3">
//           <div className="flex justify-between text-sm">
//             <span className="text-gray-600">Subtotal:</span>
//             <span className="font-medium">{subtotal.toFixed(2)}</span>
//           </div>

//           {/* Discount Input */}
//           <div className="flex justify-between items-center text-sm">
//             <label className="text-gray-600">Discount:</label>
//             <input
//               type="number"
//               value={discountAmount}
//               onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
//               className="w-20 text-right border border-gray-300 rounded px-2 py-1 text-sm"
//               min="0"
//               max={subtotal}
//               step="0.01"
//               placeholder="0.00"
//             />
//           </div>

//           <div className="flex justify-between text-lg font-bold border-t pt-2">
//             <span>Grand Total:</span>
//             <span className="text-blue-600">{grandTotal.toFixed(2)}</span>
//           </div>

//           {/* Payment Method */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">
//               Payment Method:
//             </label>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setPaymentMethod("CASH")}
//                 className={`flex-1 py-2 px-3 text-sm rounded-md border transition-colors ${
//                   paymentMethod === "CASH"
//                     ? "bg-blue-500 text-white border-blue-500"
//                     : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 Cash
//               </button>
//               <button
//                 onClick={() => setPaymentMethod("CARD")}
//                 className={`flex-1 py-2 px-3 text-sm rounded-md border transition-colors ${
//                   paymentMethod === "CARD"
//                     ? "bg-blue-500 text-white border-blue-500"
//                     : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
//                 }`}
//               >
//                 Card
//               </button>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-2 pt-2">
//             <Button
//               variant="secondary"
//               onClick={handleClearSale}
//               disabled={isCreatingSale}
//               className="flex-1"
//             >
//               Clear
//             </Button>
//             <Button
//               variant="primary"
//               onClick={handleConfirmSale}
//               isLoading={isCreatingSale}
//               disabled={
//                 selectedProducts.length === 0 || 
//                 grandTotal <= 0 || 
//                 isCreatingSale ||
//                 selectedProducts.some(item => !hasActiveBatchesAvailable(item))
//               }
//               className="flex-1"
//             >
//               Confirm Sale
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Toast */}
//       {toast.show && (
//         <Toast
//           message={toast.message}
//           type={toast.type}
//           onClose={hideToast}
//         />
//       )}
//     </>
//   );
// };

// export default SalePanel;










"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import { SaleItem } from "@/types/sale.types";
import { useSaleStore } from "@/stores/saleStore";
import { useSaleContext } from "@/contexts/SaleContext";
import { createSaleAction } from "@/actions/sale.actions";
import Button from "@/components/shared ui/Button";
import Toast from "@/components/shared ui/Toast";
import { GiMedicines } from "react-icons/gi";
import { ImSpinner2 } from "react-icons/im";
import { GoCheck } from "react-icons/go";
import TabletSellSection from "@/components/Admin/Sale/Create Sale/TabletSellSection";
import { TabletSaleConfig } from "@/types/tablet-sale.types";


const SalePanel: React.FC = () => {
  const { 
    selectedProducts, 
    toast,
    updateQuantity, 
    removeProduct, 
    clearSale, 
    showToast,
    hideToast
  } = useSaleStore();

  const { getAvailableStock, getProductById } = useSaleContext();

  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
  const [tabletConfigs, setTabletConfigs] = useState<Record<number, TabletSaleConfig>>({});
  const [isPending, startTransition] = useTransition();

 
  // Calculate subtotal
  const subtotal = selectedProducts.reduce((sum, item) => {
    const price = typeof item.totalPrice === 'number' ? item.totalPrice : 0;
    return sum + price;
  }, 0);
  const grandTotal = Math.max(0, subtotal - discountAmount);

  const handleQuantityChange = (item: SaleItem, newQuantity: number) => {
    // Check if product has active batches before allowing quantity changes
    if (!hasActiveBatchesAvailable(item)) {
      showToast(`Cannot modify quantity: ${item.item?.itemName || 'Product'} has no active non-expired batches available`, 'error');
      return;
    }

    if (newQuantity <= 0) {
      removeProduct(item.itemId);
      // Also remove tablet config
      const newConfigs = { ...tabletConfigs };
      delete newConfigs[item.itemId];
      setTabletConfigs(newConfigs);
      showToast(`${item.item?.itemName || 'Product'} removed from sale`);
      return;
    }

    // Check if this is a tablet sale (either via config or direct sell type)
    const tabletConfig = tabletConfigs[item.itemId];
    const isTabletSaleViaConfig = tabletConfig?.enabled && item.item?.tabletsPerStrip && item.item?.pricePerUnit;
    const isTabletSaleViaSellType = item.sellType === "SINGLE_TABLET" && item.item?.tabletsPerStrip;

    if (isTabletSaleViaConfig) {
      // For tablet sales via config, update the tablet config
      const availableTablets = getAvailableTabletsForProduct(item);
      if (newQuantity > availableTablets) {
        showToast(`Cannot set quantity to ${newQuantity}. Only ${availableTablets} tablets available`, 'error');
        return;
      }
      
      handleTabletConfigChange(item.itemId, {
        enabled: true,
        quantity: newQuantity
      });
      return;
    } else if (isTabletSaleViaSellType) {
      // For tablet sales via sell type, validate against tablet limits
      const availableTablets = getAvailableTabletsForProduct(item);
      if (newQuantity > availableTablets) {
        showToast(`Cannot set quantity to ${newQuantity}. Only ${availableTablets} tablets available`, 'error');
        return;
      }
      
      updateQuantity(item.itemId, newQuantity, "SINGLE_TABLET");
      return;
    }

    // Regular quantity change logic for strips/units
    let availableStock = 0;
    if (item.item?.batches) {
      item.item.batches.forEach((batch: any) => {
        if (batch.status === "ACTIVE" && batch.quantity > 0) {
          // Check if batch is not expired
          let isNotExpired = true;
          if (batch.expiryDate) {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const expiryDate = new Date(batch.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);
            isNotExpired = expiryDate >= currentDate;
          }
          
          if (isNotExpired) {
            availableStock += batch.quantity;
          }
        }
      });
    }
    
    const otherSelectedQuantity = selectedProducts
      .filter(p => p.itemId !== item.itemId)
      .reduce((sum, p) => p.itemId === item.itemId ? sum + p.quantity : sum, 0);
    
    const maxAllowedQuantity = availableStock - otherSelectedQuantity;
    
    if (newQuantity > maxAllowedQuantity) {
      showToast(`Cannot set quantity to ${newQuantity}. Only ${maxAllowedQuantity} available in stock`, 'error');
      return;
    }

    updateQuantity(item.itemId, Math.max(1, newQuantity), item.sellType);
  };

  const handleTabletConfigChange = (itemId: number, config: TabletSaleConfig) => {
    // Find the item to check batch status
    const item = selectedProducts.find(p => p.itemId === itemId);
    if (item && !hasActiveBatchesAvailable(item)) {
      showToast(`Cannot modify tablet configuration: ${item.item?.itemName || 'Product'} has no active non-expired batches available`, 'error');
      return;
    }

    const newConfigs = { ...tabletConfigs, [itemId]: config };
    setTabletConfigs(newConfigs);

    // Update the sale item with tablet pricing
    const product = getProductById(itemId);
    if (product && config.enabled && config.quantity > 0) {
      updateQuantity(itemId, config.quantity, "SINGLE_TABLET");
    } else if (!config.enabled) {
      // Switch back to regular sale
      updateQuantity(itemId, 1, "FULL_STRIP");
    }
  };

  const isInTabletMode = (item: SaleItem): boolean => {
    return Boolean(tabletConfigs[item.itemId]?.enabled) || 
           Boolean(item.sellType === "SINGLE_TABLET" && item.item?.tabletsPerStrip);
  };

  // Check if product has complete strips available (not just remaining tablets)
  const hasCompleteStripsAvailable = (item: SaleItem): boolean => {
    if (!item.item?.batches || !item.item?.tabletsPerStrip) return false;
    
    return item.item.batches.some((batch: any) => {
      const hasStock = batch.quantity > 0 && batch.status === "ACTIVE";
      if (!hasStock) return false;
      
      // Check if batch is not expired
      if (!batch.expiryDate) return true; // No expiry date means it doesn't expire
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const expiryDate = new Date(batch.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate >= currentDate;
    });
  };

  // Check if product has active batches available for selling
  const hasActiveBatchesAvailable = (item: SaleItem): boolean => {
    if (!item.item?.batches) return false;
    
    return item.item.batches.some((batch: any) => {
      // Check if batch is active and has stock
      const isActiveWithStock = batch.status === "ACTIVE" && (batch.quantity > 0 || (batch.remainingTablets && batch.remainingTablets > 0));
      
      if (!isActiveWithStock) return false;
      
      // Check if batch is not expired
      if (!batch.expiryDate) return true; // No expiry date means it doesn't expire
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const expiryDate = new Date(batch.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate >= currentDate;
    });
  };

  // Check if product has only remaining tablets (no complete strips)
  const hasOnlyRemainingTablets = (item: SaleItem): boolean => {
    if (!item.item?.batches || !item.item?.tabletsPerStrip) return false;
    
    const hasActiveCompleteStrips = item.item.batches.some((batch: any) => {
      const hasStock = batch.quantity > 0 && batch.status === "ACTIVE";
      if (!hasStock) return false;
      
      // Check if batch is not expired
      if (!batch.expiryDate) return true; // No expiry date means it doesn't expire
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const expiryDate = new Date(batch.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate >= currentDate;
    });
    
    const hasActivePartialTablets = item.item.batches.some((batch: any) => {
      const hasTablets = (batch.remainingTablets || 0) > 0 && batch.status === "ACTIVE";
      if (!hasTablets) return false;
      
      // Check if batch is not expired
      if (!batch.expiryDate) return true; // No expiry date means it doesn't expire
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const expiryDate = new Date(batch.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      return expiryDate >= currentDate;
    });
    
    return !hasActiveCompleteStrips && hasActivePartialTablets;
  };

  const getCurrentQuantity = (item: SaleItem): number => {
    if (tabletConfigs[item.itemId]?.enabled) {
      return tabletConfigs[item.itemId].quantity;
    }
    return item.quantity;
  };

  const getMaxQuantityForCurrentMode = (item: SaleItem): number => {
    if (isInTabletMode(item)) {
      return getAvailableTabletsForProduct(item);
    }
    return getMaxQuantityForItem(item);
  };

  const getAvailableTabletsForProduct = (item: SaleItem): number => {
    if (!item.item?.tabletsPerStrip || !item.item?.batches) return 0;
    
    // Calculate available tablets from ACTIVE and non-expired batches only
    let totalTablets = 0;
    item.item.batches.forEach((batch: any) => {
      if (batch.status === "ACTIVE") {
        // Check if batch is not expired
        let isNotExpired = true;
        if (batch.expiryDate) {
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);
          const expiryDate = new Date(batch.expiryDate);
          expiryDate.setHours(0, 0, 0, 0);
          isNotExpired = expiryDate >= currentDate;
        }
        
        if (isNotExpired) {
          // Add complete strips as tablets
          if (batch.quantity > 0 && item.item?.tabletsPerStrip) {
            totalTablets += batch.quantity * item.item.tabletsPerStrip;
          }
          // Add remaining tablets
          if (batch.remainingTablets > 0) {
            totalTablets += batch.remainingTablets;
          }
        }
      }
    });
    
    return totalTablets;
  };

  const getMaxQuantityForItem = (item: SaleItem) => {
    // Get available stock from ACTIVE and non-expired batches only
    let availableStock = 0;
    if (item.item?.batches) {
      item.item.batches.forEach((batch: any) => {
        if (batch.status === "ACTIVE" && batch.quantity > 0) {
          // Check if batch is not expired
          let isNotExpired = true;
          if (batch.expiryDate) {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            const expiryDate = new Date(batch.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);
            isNotExpired = expiryDate >= currentDate;
          }
          
          if (isNotExpired) {
            availableStock += batch.quantity;
          }
        }
      });
    }
    
    const otherSelectedQuantity = selectedProducts
      .filter(p => p.itemId !== item.itemId)
      .reduce((sum, p) => p.itemId === item.itemId ? sum + p.quantity : sum, 0);
    
    return availableStock - otherSelectedQuantity;
  };

  const handleSellTypeChange = (item: SaleItem, sellType: "FULL_STRIP" | "SINGLE_TABLET" | "ML") => {
    console.log("handleSellTypeChange called:", { itemId: item.itemId, sellType, currentSellType: item.sellType });
    
    // Check if product has active batches before allowing sell type changes
    if (!hasActiveBatchesAvailable(item)) {
      showToast(`Cannot change sell type: ${item.item?.itemName || 'Product'} has no active non-expired batches available`, 'error');
      return;
    }
    
    // If trying to select FULL_STRIP but only tablets are available, force SINGLE_TABLET
    if (sellType === "FULL_STRIP" && hasOnlyRemainingTablets(item)) {
      console.log("Forcing SINGLE_TABLET mode - only remaining tablets available");
      sellType = "SINGLE_TABLET";
      showToast("Only individual tablets available for this product", 'info' as any);
    }
    
    if (sellType === "SINGLE_TABLET" && item.item?.tabletsPerStrip) {
      // Check if product has pricePerUnit for enhanced tablet config
      if (item.item?.pricePerUnit) {
        console.log("Using enhanced tablet config mode");
        // Enable tablet config when switching to SINGLE_TABLET (enhanced mode)
        const availableTablets = getAvailableTabletsForProduct(item);
        const tabletQuantity = Math.min(item.quantity, availableTablets);
        
        handleTabletConfigChange(item.itemId, {
          enabled: true,
          quantity: tabletQuantity
        });
      } else {
        console.log("Using basic tablet mode");
        // Basic tablet mode without enhanced config
        // Convert current strip quantity to tablet quantity for initial value
        const tabletQuantity = item.item.tabletsPerStrip ? item.quantity * item.item.tabletsPerStrip : item.quantity;
        console.log("Converting strips to tablets:", { strips: item.quantity, tablets: tabletQuantity });
        updateQuantity(item.itemId, tabletQuantity, sellType);
      }
    } else if (sellType === "FULL_STRIP") {
      console.log("Switching to strip mode");
      // Disable tablet config when switching to FULL_STRIP
      handleTabletConfigChange(item.itemId, {
        enabled: false,
        quantity: 0
      });
    } else {
      console.log("Using regular sell type:", sellType);
      // For other sell types, just update normally
      updateQuantity(item.itemId, item.quantity, sellType);
    }
  };

  // Auto-select appropriate sell type based on available stock (only for initial setup)
  useEffect(() => {
    selectedProducts.forEach(item => {
      if (item.item?.tabletsPerStrip) {
        const hasCompleteStrips = hasCompleteStripsAvailable(item);
        const hasOnlyTablets = hasOnlyRemainingTablets(item);
        
        // Only auto-select if no sell type is set yet or if forced by stock constraints
        if (hasOnlyTablets && item.sellType !== "SINGLE_TABLET") {
          console.log("Auto-selecting SINGLE_TABLET for product with only remaining tablets:", item.item.itemName);
          handleSellTypeChange(item, "SINGLE_TABLET");
        } else if (hasCompleteStrips && !item.sellType) {
          // Only set default to FULL_STRIP if no sell type is set yet
          console.log("Setting default FULL_STRIP for product with complete strips available:", item.item.itemName);
          updateQuantity(item.itemId, item.quantity, "FULL_STRIP");
        }
      }
    });
  }, [selectedProducts.length]); // Only run when products are added/removed, not on every change

  const handleRemoveProduct = (item: SaleItem) => {
    removeProduct(item.itemId);
    // Also remove tablet config when removing product
    const newConfigs = { ...tabletConfigs };
    delete newConfigs[item.itemId];
    setTabletConfigs(newConfigs);
    showToast(`${item.item?.itemName || 'Product'} removed from sale`);
  };

  const handleConfirmSale = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple simultaneous calls
    if (selectedProducts.length === 0 || isPending) {
      return;
    }

    // Check if all selected products have active batches
    const productsWithInactiveBatches = selectedProducts.filter(item => !hasActiveBatchesAvailable(item));
    if (productsWithInactiveBatches.length > 0) {
      const productNames = productsWithInactiveBatches.map(item => item.item?.itemName).join(', ');
      showToast(`Cannot complete sale: ${productNames} have no active non-expired batches available`, 'error');
      return;
    }

    startTransition(async () => {
      try {
        console.log("Creating sale with data:", {
          itemCount: selectedProducts.length,
          grandTotal,
          paymentMethod,
          items: selectedProducts.map(item => ({
            itemId: item.itemId,
            sellType: item.sellType,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice)
          }))
        });

        const result = await createSaleAction({
          customerId: null, // No customer for now
          subtotal,
          discountAmount,
          grandTotal,
          paymentMethod,
          items: selectedProducts.map(item => ({
            itemId: item.itemId,
            sellType: item.sellType,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice)
          }))
        });

        console.log("Sale creation result:", result);
        
        // Log debugging info if available
        if (result.data?.debugInfo) {
          console.log("API Debugging Info:", result.data.debugInfo);
        }

        if (result.success) {
          showToast("Sale created successfully!");
          clearSale(); // Clear the sale
          setDiscountAmount(0);
          setPaymentMethod("CASH");
          setTabletConfigs({}); // Clear tablet configs
        } else {
          console.error("Sale creation failed:", result.error);
          showToast(result.error || "Failed to create sale", 'error');
        }
      } catch (error) {
        console.error("Sale creation error:", error);
        showToast("Failed to create sale. Please try again.", 'error');
      }
    });
  };

  const handleClearSale = () => {
    clearSale();
    setDiscountAmount(0);
    setPaymentMethod("CASH");
    setTabletConfigs({});
    showToast("Sale cleared");
  };

  if (selectedProducts.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <div className="text-6xl mb-4"> <GiMedicines/></div>
          <h3 className="text-lg font-medium mb-2">No Items Selected</h3>
          <p className="text-sm text-center">
            Select products from the left panel to add them to the sale.
          </p>
        </div>
        
        {/* Toast */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </>
    );
  }

  return (
    <>
      <form onSubmit={handleConfirmSale} className="space-y-4">
        {/* Selected Products */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {selectedProducts.map((item) => (
            <div key={item.itemId} className={`border rounded-lg p-4 ${
              !hasActiveBatchesAvailable(item) 
                ? "border-red-200 bg-red-50" 
                : "border-gray-200 bg-gray-50"
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 text-sm">
                      {item.item?.itemName}
                    </h4>
                    {!hasActiveBatchesAvailable(item) && (
                      <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                        Inactive/Expired Batch
                      </span>
                    )}
                  </div>
                  {item.item?.brand && (
                    <p className="text-xs text-gray-600">{item.item.brand}</p>
                  )}
                  {item.item?.strength && (
                    <p className="text-xs text-gray-500">{item.item.strength}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveProduct(item)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>

              {/* Tablet Sell Section */}
              {item.item?.tabletsPerStrip && item.item?.pricePerUnit && (
                <div className="mb-3">
                  <TabletSellSection
                    product={item.item}
                    tabletConfig={tabletConfigs[item.itemId] || { enabled: false, quantity: 0 }}
                    onConfigChange={(config) => handleTabletConfigChange(item.itemId, config)}
                    availableTablets={getAvailableTabletsForProduct(item)}
                  />
                </div>
              )}

              {/* Sell Type Selection for Tablets */}
              {item.item?.tabletsPerStrip && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sell Type:
                  </label>
                  <div className="flex gap-2">
                    {/* Only show Strip option if there are complete strips available */}
                    {hasCompleteStripsAvailable(item) && (
                      <button
                        type="button"
                        onClick={() => handleSellTypeChange(item, "FULL_STRIP")}
                        disabled={!hasActiveBatchesAvailable(item)}
                        className={`px-3 py-1 text-xs rounded-md border ${
                          !hasActiveBatchesAvailable(item)
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : item.sellType === "FULL_STRIP"
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        Strip
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSellTypeChange(item, "SINGLE_TABLET")}
                      disabled={!hasActiveBatchesAvailable(item)}
                      className={`px-3 py-1 text-xs rounded-md border ${
                        !hasActiveBatchesAvailable(item)
                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                          : item.sellType === "SINGLE_TABLET"
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      Tablet
                    </button>
                  </div>
                  {/* Show info message when only tablets are available */}
                  {hasOnlyRemainingTablets(item) && (
                    <p className="text-xs text-amber-600 mt-1">
                      Only individual tablets available (no complete strips)
                    </p>
                  )}
                  {/* Show warning when no active batches are available */}
                  {!hasActiveBatchesAvailable(item) && (
                    <p className="text-xs text-red-600 mt-1">
                      No active non-expired batches available for this product
                    </p>
                  )}
                </div>
              )}

              {/* Quantity Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-700">
                    {isInTabletMode(item) ? 'Tablets:' : 'Qty:'}
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const currentQty = getCurrentQuantity(item);
                        handleQuantityChange(item, currentQty - 1);
                      }}
                      disabled={!hasActiveBatchesAvailable(item)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                        !hasActiveBatchesAvailable(item)
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={getCurrentQuantity(item)}
                      onChange={(e) => handleQuantityChange(item, parseInt(e.target.value) || 1)}
                      disabled={!hasActiveBatchesAvailable(item)}
                      className={`w-16 text-center text-sm border border-gray-300 rounded px-2 py-1 ${
                        !hasActiveBatchesAvailable(item)
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : ""
                      }`}
                      min="1"
                      max={getMaxQuantityForCurrentMode(item)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const currentQty = getCurrentQuantity(item);
                        handleQuantityChange(item, currentQty + 1);
                      }}
                      disabled={!hasActiveBatchesAvailable(item) || getCurrentQuantity(item) >= getMaxQuantityForCurrentMode(item)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                        !hasActiveBatchesAvailable(item) || getCurrentQuantity(item) >= getMaxQuantityForCurrentMode(item)
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gray-200 hover:bg-gray-300"
                      }`}
                    >
                      +
                    </button>
                  </div>
                  {/* Stock info */}
                  <span className="text-xs text-gray-500">
                    {isInTabletMode(item)
                      ? `(${getAvailableTabletsForProduct(item)} tablets)`
                      : `(${getMaxQuantityForItem(item)} ${getMaxQuantityForItem(item) > 1 ? "units" : "unit"})`
                    }
                  </span>
                  {/* Batch status warning */}
                  {!hasActiveBatchesAvailable(item) && (
                    <span className="text-xs text-red-500 font-medium">
                      (No active non-expired batches)
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-xs text-gray-600">
                    {isInTabletMode(item)
                      ? `${item.unitPrice} × ${getCurrentQuantity(item)} tablets`
                      : `${item.unitPrice} × ${getCurrentQuantity(item)}`
                    }
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {(typeof item.totalPrice === 'number' ? item.totalPrice : 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sale Summary */}
        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">{subtotal.toFixed(2)}</span>
          </div>

          {/* Discount Input */}
          <div className="flex justify-between items-center text-sm">
            <label className="text-gray-600">Discount:</label>
            <input
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-20 text-right border border-gray-300 rounded px-2 py-1 text-sm"
              min="0"
              max={subtotal}
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Grand Total:</span>
            <span className="text-blue-600">{grandTotal.toFixed(2)}</span>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Payment Method:
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`flex-1 py-2 px-3 text-sm rounded-md border transition-colors ${
                  paymentMethod === "CASH"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Cash
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("CARD")}
            className={`flex-1 py-2 px-3 text-sm rounded-md border transition-colors ${
              paymentMethod === "CARD"
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            Card
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={handleClearSale}
          disabled={isPending}
          className="flex-1"
        >
          Clear
        </Button>
        <Button
          type="submit"
          variant="primary"
          leftIcon={isPending ? <ImSpinner2 className="animate-spin" /> : <GoCheck />}
          disabled={
            selectedProducts.length === 0 || 
            grandTotal <= 0 || 
            isPending ||
            selectedProducts.some(item => !hasActiveBatchesAvailable(item))
          }
          className="flex-1"
        >
          {isPending ? 'Creating' : 'Create Sale'}
        </Button>
      </div>
    </div>
  </form>

  {/* Toast */}
  {toast.show && (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={hideToast}
    />
  )}
</>
);
};
export default SalePanel;