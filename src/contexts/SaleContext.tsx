"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ProductForSale } from '@/types/sale.types';

interface SaleContextType {
  products: ProductForSale[];
  setProducts: (products: ProductForSale[]) => void;
  getProductById: (id: number) => ProductForSale | undefined;
  getAvailableStock: (id: number) => number;
}

const SaleContext = createContext<SaleContextType | undefined>(undefined);

export const useSaleContext = () => {
  const context = useContext(SaleContext);
  if (!context) {
    throw new Error('useSaleContext must be used within a SaleProvider');
  }
  return context;
};

interface SaleProviderProps {
  children: ReactNode;
}

export const SaleProvider: React.FC<SaleProviderProps> = ({ children }) => {
  const [products, setProducts] = useState<ProductForSale[]>([]);

  const getProductById = (id: number) => {
    return products.find(product => product.id === id);
  };

  const getAvailableStock = (id: number) => {
    const product = getProductById(id);
    if (!product?.batches) return 0;
    
    // Calculate available stock from ACTIVE and non-expired batches only
    let availableStock = 0;
    product.batches.forEach((batch: any) => {
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
    
    return availableStock;
  };

  const value: SaleContextType = {
    products,
    setProducts,
    getProductById,
    getAvailableStock,
  };

  return (
    <SaleContext.Provider value={value}>
      {children}
    </SaleContext.Provider>
  );
};