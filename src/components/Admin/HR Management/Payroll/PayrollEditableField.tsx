"use client";

import React, { useState, useTransition } from "react";
import EditButton from "@/components/shared ui/EditButton";
import MarkButton from "@/components/shared ui/MarkButton";
import { updatePayrollAction } from "@/actions/payroll.actions";
import { useRouter } from "next/navigation";

interface PayrollEditableFieldProps {
  payrollId: number;
  fieldName: "allowances" | "deductions";
  currentValue: string;
  disabled?: boolean;
}

export default function PayrollEditableField({
  payrollId,
  fieldName,
  currentValue,
  disabled = false,
}: PayrollEditableFieldProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleEdit = () => {
    if (disabled || isPending) return;
    setIsEditing(true);
    setEditValue(currentValue);
  };

  const handleSave = async () => {
    const value = Number(editValue);
    if (isNaN(value) || value < 0) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append(fieldName, value.toString());

        const result = await updatePayrollAction(
          payrollId.toString(),
          formData
        );

        if (result.success) {
          setIsEditing(false);
          setEditValue("");
          router.refresh();
        } else {
          console.error(result.error);
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleCancel = () => {
    if (isPending) return;
    setIsEditing(false);
    setEditValue("");
  };

  if (isEditing) {
    return (

      //Edit allowences & deductions

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={editValue}
          disabled={isPending}
          onChange={e => setEditValue(e.target.value)}
          className="w-20 px-1 py-0.5 rounded bg-[#F1F5F9] text-sm"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
        />

        <MarkButton
          ariaLabel={`Save ${fieldName}`}
          variant="secondary"
          title={isPending ? "Saving..." : "Save"}
          disabled={isPending}
          onClick={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span>{Number(currentValue).toLocaleString()}</span>

      <EditButton
        onClick={handleEdit}
        disabled={disabled || isPending}
        variant="ghost"
        ariaLabel={`Edit ${fieldName}`}
      />
    </div>
  );
}
