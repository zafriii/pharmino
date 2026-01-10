"use client";

import { useState } from "react";
import EditButton from "@/components/shared ui/EditButton";
import DeleteButton from "@/components/shared ui/DeleteButton";
import ConfirmModal from "@/components/shared ui/ConfirmModal";
import Toast from "@/components/shared ui/Toast";
import CategoryForm from "./CategoryForm";
import { deleteCategoryAction } from "@/actions/category.actions";
import type { Category } from "@/types/category.types"; 

interface CategoryActionProps {
  category: Category;
}

export default function CategoryAction({ category }: CategoryActionProps) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "success" | "fail" | "error";} | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  // const [isPending, startTransition] = useTransition();

  // Open delete confirmation
  const handleDelete = () => {
    setOpenConfirm(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteCategoryAction(category.id.toString());

      if (res.success) {
        setToastMessage({ message: res.message || "Category deleted successfully", type: "success" });
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

  const mapToFormValues = (cat: Category) => ({
    id: cat.id.toString(),
    name: cat.name,
    imageUrl: cat.imageUrl || null,
  });

  return (
    <div className="flex gap-2">
      {/* EDIT BUTTON */}
      <EditButton variant="secondary" onClick={() => setOpenEdit(true)} ariaLabel="Edit Category" />

      {/* DELETE BUTTON */}
      <DeleteButton onClick={handleDelete} ariaLabel="Delete Category" />

      {/* Edit Modal */}
      <CategoryForm
        key={openEdit ? category.id : "closed"}
        open={openEdit}
        setOpen={setOpenEdit}
        category={mapToFormValues(category)}
        onSuccess={() => {
          setToastMessage({ message: "Category updated successfully!", type: "success" });
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={openConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete "${category.name}"?`}
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