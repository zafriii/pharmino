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
    return product?.totalStock || 0;
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