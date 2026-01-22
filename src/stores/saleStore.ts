import { create } from 'zustand';
import { ProductForSale, SaleItem } from '@/types/sale.types';
import { isBatchAvailableForSale } from '@/lib/batch-utils';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'fail' | 'info';
}

interface SaleState {
  selectedProducts: SaleItem[];
  isCreatingSale: boolean;
  toast: ToastState;

  // Actions
  addProduct: (product: ProductForSale) => void;
  updateQuantity: (itemId: number, quantity: number, sellType?: "FULL_STRIP" | "SINGLE_TABLET" | "ML") => void;
  removeProduct: (itemId: number) => void;
  clearSale: () => void;
  setCreatingSale: (isCreating: boolean) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'fail' | 'info') => void;
  hideToast: () => void;
}

export const useSaleStore = create<SaleState>((set, get) => ({
  selectedProducts: [],
  isCreatingSale: false,
  toast: { show: false, message: '', type: 'success' },

  showToast: (message: string, type: 'success' | 'error' | 'fail' | 'info' = 'success') => {
    set({ toast: { show: true, message, type } });
  },

  hideToast: () => {
    set({ toast: { show: false, message: '', type: 'success' } });
  },

  addProduct: (product: ProductForSale) => {
    const { selectedProducts, showToast } = get();

    // Calculate available tablets for tablet products, or regular quantity for others
    let totalAvailableUnits = 0;
    // A product is treated as a tablet product if it has tabletsPerStrip defined, regardless of baseUnit capitalization
    const isTablet = !!product.tabletsPerStrip && (product.tabletsPerStrip > 0);

    if (product.batches) {
      product.batches.forEach((batch: any) => {
        if (isBatchAvailableForSale(batch)) {
          if (isTablet) {
            // totalAvailableUnits will be the total number of individual tablets
            totalAvailableUnits += (batch.quantity * product.tabletsPerStrip!) + (batch.remainingTablets || 0);
          } else {
            // totalAvailableUnits will be the total number of base units
            totalAvailableUnits += batch.quantity;
          }
        }
      });
    }

    if (totalAvailableUnits <= 0) {
      showToast(`${product.itemName} has no active stock available`, 'error');
      return;
    }

    // Check if product is already selected
    const existingItem = selectedProducts.find(item => item.itemId === product.id);

    if (existingItem) {
      // For tablets, we need to compare apples to apples (everything in tablets)
      let currentSelectionUnits = existingItem.quantity;
      if (isTablet && existingItem.sellType === "FULL_STRIP") {
        currentSelectionUnits = existingItem.quantity * product.tabletsPerStrip!;
      }

      if (currentSelectionUnits >= totalAvailableUnits) {
        const unitLabel = isTablet ? (existingItem.sellType === "FULL_STRIP" ? "strips" : "tablets") : "units";
        const availableDisplay = isTablet && existingItem.sellType === "FULL_STRIP"
          ? Math.floor(totalAvailableUnits / product.tabletsPerStrip!)
          : totalAvailableUnits;

        showToast(`Cannot add more ${product.itemName}. Only ${availableDisplay} ${unitLabel} available`, 'error');
        return;
      }
      // If already selected, increase quantity
      get().updateQuantity(product.id, existingItem.quantity + 1, existingItem.sellType);
      showToast(`${product.itemName} quantity increased`);
      return;
    }

    // Helper function to check if product has only remaining tablets
    const hasOnlyRemainingTablets = (product: ProductForSale): boolean => {
      if (!product.batches || !product.tabletsPerStrip) return false;
      const hasCompleteStrips = product.batches.some(batch => {
        return isBatchAvailableForSale(batch) && batch.quantity > 0;
      });

      const hasPartialTablets = product.batches.some(batch => {
        return isBatchAvailableForSale(batch) && (batch.remainingTablets || 0) > 0;
      });

      return !hasCompleteStrips && hasPartialTablets;
    };

    // Determine default sell type and price for tablets
    let sellType: "FULL_STRIP" | "SINGLE_TABLET" | "ML" | undefined;
    let unitPrice = Number(product.sellingPrice) || 0;

    if (isTablet) {
      // Check if only remaining tablets are available
      if (hasOnlyRemainingTablets(product)) {
        sellType = "SINGLE_TABLET";
        unitPrice = product.pricePerUnit ? Number(product.pricePerUnit) : Number(product.sellingPrice) / product.tabletsPerStrip!;
        showToast(`${product.itemName} added - only individual tablets available`, 'info');
      } else {
        sellType = "FULL_STRIP"; // Default to strip for tablets
        unitPrice = Number(product.sellingPrice) || 0; // Strip price
      }
    } else if (product.baseUnit?.toUpperCase() === "ML") {
      sellType = "ML";
      unitPrice = Number(product.pricePerUnit) || Number(product.sellingPrice) || 0;
    }

    const quantity = 1; // Default quantity is 1
    const totalPrice = unitPrice * quantity;

    const newItem: SaleItem = {
      itemId: product.id,
      sellType,
      quantity,
      unitPrice,
      totalPrice,
      item: {
        id: product.id,
        itemName: product.itemName,
        imageUrl: product.imageUrl,
        // category:product.category,        
        brand: product.brand,
        strength: product.strength,
        tabletsPerStrip: product.tabletsPerStrip,
        baseUnit: product.baseUnit,
        sellingPrice: product.sellingPrice,
        pricePerUnit: product.pricePerUnit,
        batches: product.batches, // Include batch information
      }
    };

    set(state => ({
      selectedProducts: [...state.selectedProducts, newItem]
    }));

    if (!hasOnlyRemainingTablets(product)) {
      showToast(`${product.itemName} added to sale`);
    }
  },

  updateQuantity: (itemId: number, quantity: number, sellType?: "FULL_STRIP" | "SINGLE_TABLET" | "ML") => {
    console.log("Store updateQuantity called:", { itemId, quantity, sellType });

    set(state => ({
      selectedProducts: state.selectedProducts.map(item => {
        if (item.itemId === itemId) {
          const newQuantity = Math.max(1, quantity); // Ensure minimum quantity is 1
          let unitPrice = Number(item.unitPrice) || 0;

          const isTablet = item.item ? (!!item.item.tabletsPerStrip && item.item.tabletsPerStrip > 0) : false;
          // const isMl = item.item?.baseUnit?.toUpperCase() === "ML";

          // Recalculate unit price if sell type changed
          if (sellType && sellType !== item.sellType && item.item) {
            console.log("Recalculating price for sell type change:", { from: item.sellType, to: sellType });

            if (sellType === "SINGLE_TABLET") {
              if (item.item.pricePerUnit) {
                // Use per tablet price if available
                unitPrice = Number(item.item.pricePerUnit);
                console.log("Using pricePerUnit:", unitPrice);
              } else if (item.item.sellingPrice && item.item.tabletsPerStrip) {
                // Calculate per tablet price from strip price
                unitPrice = Number(item.item.sellingPrice) / item.item.tabletsPerStrip;
                console.log("Calculated tablet price from strip price:", { stripPrice: item.item.sellingPrice, tabletsPerStrip: item.item.tabletsPerStrip, tabletPrice: unitPrice });
              } else {
                // Fallback to selling price
                unitPrice = Number(item.item.sellingPrice) || 0;
                console.log("Using fallback selling price:", unitPrice);
              }
            } else if (sellType === "FULL_STRIP" && item.item.sellingPrice) {
              // Use strip price
              unitPrice = Number(item.item.sellingPrice);
              console.log("Using strip price:", unitPrice);
            } else if (sellType === "ML") {
              unitPrice = Number(item.item.pricePerUnit) || Number(item.item.sellingPrice) || 0;
              console.log("Using ML price:", unitPrice);
            } else {
              // Default to selling price
              unitPrice = Number(item.item.sellingPrice) || 0;
              console.log("Using default selling price:", unitPrice);
            }
          }

          const totalPrice = unitPrice * newQuantity;

          const updatedItem = {
            ...item,
            quantity: newQuantity,
            sellType: sellType || item.sellType,
            unitPrice,
            totalPrice
          };

          console.log("Updated item:", updatedItem);
          return updatedItem;
        }
        return item;
      })
    }));
  },

  removeProduct: (itemId: number) => {
    set(state => ({
      selectedProducts: state.selectedProducts.filter(item => item.itemId !== itemId)
    }));
  },

  clearSale: () => {
    set({ selectedProducts: [] });
  },

  setCreatingSale: (isCreating: boolean) => {
    set({ isCreatingSale: isCreating });
  }
}));