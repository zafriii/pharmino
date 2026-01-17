'use client';

import React, { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import SideDrawerModal from '@/components/shared ui/SideDrawerModal';
import Button from '@/components/shared ui/Button';
import CustomInput from '@/components/shared ui/CustomInput';
import Toast from '@/components/shared ui/Toast';

import { GoCheck } from 'react-icons/go';
import { RxCross2 } from 'react-icons/rx';
import { ImSpinner2 } from 'react-icons/im';

import {
  createExpenseAction,
  updateExpenseAction,
} from '@/actions/expense.actions';

import { Expense, ExpenseFormData } from '@/types/expense.types';

interface ExpenseFormProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  expense?: Expense;
  onSuccess?: () => void;
}

const initialValues: ExpenseFormData = {
  reason: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
};

function ExpenseForm({
  open,
  setOpen,
  expense,
  onSuccess,
}: ExpenseFormProps) {
  const [isPending, startTransition] = useTransition();

  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'fail';
  } | null>(null);

  const formattedDate = expense?.date
    ? new Date(expense.date).toISOString().split('T')[0]
    : '';

  const defaultValues = expense
    ? { reason: expense.reason, amount: expense.amount, date: formattedDate }
    : initialValues;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ExpenseFormData>({
    defaultValues,
  });

  const onSubmit = async (data: ExpenseFormData) => {
    startTransition(async () => {
      try {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        const result = expense?.id
          ? await updateExpenseAction(expense.id, formData)
          : await createExpenseAction(formData);

        if (result?.success) {
          setToastMessage({
            message: result.message || 'Expense saved successfully',
            type: 'success',
          });

          reset(initialValues);
          setOpen(false);
          onSuccess?.();
        } else {
          setToastMessage({
            message:
              result?.error || result?.message || 'Something went wrong',
            type: 'fail',
          });
        }
      } catch (error: any) {
        console.error(error);
        setToastMessage({
          message: error.message || 'Something went wrong',
          type: 'fail',
        });
      }
    });
  };

  return (
    <>
      <SideDrawerModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={expense ? 'Update Expense' : 'Add Expense'}
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
              form="expenseForm"
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
                ? expense
                  ? 'Updating'
                  : 'Creating'
                : expense
                ? 'Update'
                : 'Create'}
            </Button>
          </>
        }
      >
        <form
          id="expenseForm"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Date */}
          <CustomInput
            label="Date"
            type="date"
            {...register('date', {
              required: 'Date is required',
            })}
            error={errors.date?.message}
          />

          {/* Reason */}
          <CustomInput
            label="Reason"
            placeholder="e.g., Office supplies, Utilities, etc."
            {...register('reason', { required: 'Reason is required' })}
            error={errors.reason?.message}
          />

          {/* Amount */}
          <CustomInput
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            {...register('amount', {
              required: 'Amount is required',
              valueAsNumber: true,
              min: {
                value: 0.01,
                message: 'Amount must be greater than 0',
              },
            })}
            error={errors.amount?.message}
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

export default ExpenseForm;
