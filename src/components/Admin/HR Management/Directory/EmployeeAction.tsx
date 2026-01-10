"use client";

import { useState } from "react";
import EditButton from "@/components/shared ui/EditButton";
import DeleteButton from "@/components/shared ui/DeleteButton";
import ConfirmModal from "@/components/shared ui/ConfirmModal";
import Toast from "@/components/shared ui/Toast";
import EmployeeForm from "./EmployeeForm";
import { deleteEmployeeAction } from "@/actions/employee.actions";
import type { Employee } from "@/types/employees.types"; 

interface EmployeeActionProps {
  employee: Employee;
}

export default function EmployeeAction({ employee }: EmployeeActionProps) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: "success" | "fail" | "error";} | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  
  // Open delete confirmation
  const handleDelete = () => {
    setOpenConfirm(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteEmployeeAction(employee.id);

      if (res.success) {
        setToastMessage({ message: res.message || "Employee deleted successfully", type: "success" });
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
      <EditButton variant="secondary" onClick={() => setOpenEdit(true)} ariaLabel="Edit Employee" />

      {/* DELETE BUTTON */}
      <DeleteButton onClick={handleDelete} ariaLabel="Delete Employee" disabled={isDeleting} />

      {/* Edit Modal */}
      <EmployeeForm
        key={openEdit ? employee.id : "closed"}
        open={openEdit}
        setOpen={setOpenEdit}
        employee={employee}
        onSuccess={() => {
          setToastMessage({ message: "Employee updated successfully!", type: "success" });
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={openConfirm}
        title="Delete Employee"
        message={`Are you sure you want to delete ${employee.name}?`}
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
