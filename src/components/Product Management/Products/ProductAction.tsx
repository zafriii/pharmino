"use client";

import { useState } from "react";
import EditButton from "@/components/shared ui/EditButton";
import DeleteButton from "@/components/shared ui/DeleteButton";
import ConfirmModal from "@/components/shared ui/ConfirmModal";
import Toast from "@/components/shared ui/Toast";
import ProductForm from "./ProductForm";
import { deleteProductAction } from "@/actions/product.actions";
import type { Product, Category } from "@/types/products.types";

interface ProductActionProps {
  product: Product;
  categories: Category[];
}

export default function ProductAction({ product, categories }: ProductActionProps) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "success" | "fail" | "error";} | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    setOpenEdit(true);
  };

  // Open delete confirmation
  const handleDelete = () => {
    setOpenConfirm(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteProductAction(product.id.toString());

      if (res.success) {
        setToastMessage({ message: res.message || "Product deleted successfully", type: "success" });
      } else {
        setToastMessage({ message: res.error || "Failed to delete.", type: "fail" });
      }
    } catch (error: any) {
      setToastMessage({ message: error.message || "Something went wrong.", type: "error" });
    } finally {
      setIsDeleting(false);
      setOpenConfirm(false);
    }
  };

  return (
    <div className="flex gap-2">
      {/* EDIT BUTTON */}
      <EditButton 
        variant="secondary" 
        onClick={handleEdit} 
        ariaLabel="Edit Product"
      />

      {/* DELETE BUTTON */}
      <DeleteButton onClick={handleDelete} ariaLabel="Delete Product" />

      {/* Edit Modal */}
      <ProductForm
        key={openEdit ? product.id : "closed"}
        open={openEdit}
        setOpen={setOpenEdit}
        product={product}
        categories={categories}
        onSuccess={() => {
          setToastMessage({ message: "Product updated successfully!", type: "success" });
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={openConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete ${product.itemName}?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setOpenConfirm(false)}
      />

      {/* Toast Message */}
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