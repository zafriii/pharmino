"use client";

import { useState } from "react";
import EditButton from "@/components/shared ui/EditButton";
import DeleteButton from "@/components/shared ui/DeleteButton";
import ConfirmModal from "@/components/shared ui/ConfirmModal";
import Toast from "@/components/shared ui/Toast";
import ExpenseForm from "./ExpenseForm";
import { deleteExpenseAction } from "@/actions/expense.actions";
import type { Expense } from "@/types/expense.types";

interface ExpenseActionProps {
  expense: Expense;
}

export default function ExpenseAction({ expense }: ExpenseActionProps) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ 
    message: string; 
    type: "success" | "fail" | "error";
  } | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = () => {
    setOpenConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteExpenseAction(expense.id);

      if (res.success) {
        setToastMessage({ 
          message: res.message || "Expense deleted successfully", 
          type: "success" 
        });
      } else {
        setToastMessage({ 
          message: res.error || "Failed to delete.", 
          type: "fail" 
        });
      }
    } catch (error: any) {
      setToastMessage({ 
        message: error.message || "Something went wrong.", 
        type: "error" 
      });
    } finally {
      setIsDeleting(false);
      setOpenConfirm(false);
    }
  };

  return (
    <div className="flex gap-2">
      <EditButton 
        variant="secondary" 
        onClick={() => setOpenEdit(true)} 
        ariaLabel="Edit Expense" 
      />

      <DeleteButton 
        onClick={handleDelete} 
        ariaLabel="Delete Expense" 
        disabled={isDeleting} 
      />

      <ExpenseForm
        key={openEdit ? expense.id : "closed"}
        open={openEdit}
        setOpen={setOpenEdit}
        expense={expense}
        onSuccess={() => {
          setToastMessage({ 
            message: "Expense updated successfully!", 
            type: "success" 
          });
        }}
      />

      <ConfirmModal
        isOpen={openConfirm}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense: ${expense.reason}?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setOpenConfirm(false)}
      />

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
