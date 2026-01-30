"use client";

import React, { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import SideDrawerModal from "@/components/shared ui/SideDrawerModal";
import Button from "@/components/shared ui/Button";
import CustomInput from "@/components/shared ui/CustomInput";
import Toast from "@/components/shared ui/Toast";

import { GoCheck } from "react-icons/go";
import { RxCross2 } from "react-icons/rx";
import { ImSpinner2 } from "react-icons/im";

import {
  createCategoryAction,
  updateCategoryAction,
} from "@/actions/category.actions";

export type CategoryFormValues = {
  name: string;
  imageUrl?: string | null;
};

interface CategoryFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  category?: (CategoryFormValues & { id: string }) | null;
  onSuccess?: () => void;
}

const initialValues: CategoryFormValues = {
  name: "",
  imageUrl: null,
};

export default function CategoryForm({
  open,
  setOpen,
  category,
  onSuccess,
}: CategoryFormProps) {
  const [isPending, startTransition] = useTransition();

  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: "success" | "error" | "fail";
  } | null>(null);

  const defaultValues = category ? category : initialValues;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    defaultValues,
  });

  const onSubmit = async (data: CategoryFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        const result = category?.id
          ? await updateCategoryAction(category.id, formData)
          : await createCategoryAction(formData);

        if (result?.success) {
          setToastMessage({
            message: result.message || "Category saved successfully",
            type: "success",
          });

          reset(initialValues);
          setOpen(false);
          onSuccess?.();
        } else {
          setToastMessage({
            message:
              result?.error || result?.message || "Something went wrong",
            type: "fail",
          });
        }
      } catch (error: any) {
        console.error(error);
        setToastMessage({
          message: error.message || "Something went wrong",
          type: "fail",
        });
      }
    });
  };

  return (
    <>
      <SideDrawerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={category ? "Update Category" : "Create Category"}
        footerButtons={
          <>
            <Button
              onClick={() => setOpen(false)}
              variant="secondary"
              leftIcon={<RxCross2 />}
            >
              Cancel
            </Button>

            <Button
              form="categoryForm"
              type="submit"
              variant="primary"
              leftIcon={
                isPending ? (
                  <ImSpinner2 className="animate-spin" />
                ) : (
                  <GoCheck />
                )
              }
              disabled={isPending}
            >
              {isPending
                ? category
                  ? "Updating"
                  : "Creating"
                : category
                  ? "Update"
                  : "Create"}
            </Button>
          </>
        }
      >
        <form
          id="categoryForm"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <CustomInput
            label="Category Name"
            placeholder="Tablet"
            {...register("name", {
              required: "Category name is required",
            })}
            error={errors.name?.message}
          />
        </form>
      </SideDrawerModal>

      {/* Toast */}
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
}
