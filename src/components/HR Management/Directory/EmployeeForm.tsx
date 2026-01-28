'use client';

import React, { useRef, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

import SideDrawerModal from '@/components/shared ui/SideDrawerModal';
import Button from '@/components/shared ui/Button';
import CustomInput from '@/components/shared ui/CustomInput';
import CustomSelector from '@/components/shared ui/CustomSelector';
import ImageUpload from '@/components/shared ui/ImageUpload';
import Toast from '@/components/shared ui/Toast';

import { GoCheck } from 'react-icons/go';
import { RxCross2 } from 'react-icons/rx';
import { ImSpinner2 } from 'react-icons/im';

import {
  createEmployeeAction,
  updateEmployeeAction,
} from '@/actions/employee.actions';

import { Employee } from '@/types/employees.types';


export type EmployeeFormValues = Omit<Employee, 'id'>;

interface EmployeeFormProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  employee?: Employee;
  onSuccess?: () => void;
}


const roleOptions = [
  { value: 'ADMIN', label: 'Admin' },
  // { value: 'OWNER', label: 'Owner' },
  { value: 'PHARMACIST', label: 'Pharmacist' },
  { value: 'CASHIER', label: 'Cashier' },
  { value: 'DELIVERY', label: 'Delivery' },
  { value: '"STOREKEEPER"', label: 'Storekeeper' },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'INACTIVE', label: 'Inactive' },
];

const dutyTypeOptions = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
];

const shiftOptions = [
  { value: 'DAY', label: 'Day' },
  { value: 'NIGHT', label: 'Night' },
];


const initialValues: EmployeeFormValues = {
  name: '',
  email: '',
  phone: '',
  role: 'ADMIN',
  status: 'ACTIVE',
  dutyType: 'FULL_TIME',
  shift: 'DAY',
  joiningDate: '',
  monthlySalary: 0,
  imageUrl: null,
};


function EmployeeForm({
  open,
  setOpen,
  employee,
  onSuccess,
}: EmployeeFormProps) {
  const [isPending, startTransition] = useTransition();
  // const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    message: string;
    type: 'success' | 'error' | 'fail';
  } | null>(null);


  const formattedDate = employee?.joiningDate
    ? new Date(employee.joiningDate).toISOString().split('T')[0]
    : '';

  const defaultValues = employee
    ? { ...employee, joiningDate: formattedDate }
    : initialValues;


  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EmployeeFormValues>({
    defaultValues,
  });


  const onSubmit = async (data: EmployeeFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();

        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });

        // if (fileInputRef.current?.files?.[0]) {
        //   formData.append('imageUrl', fileInputRef.current.files[0]);
        // }

        const result = employee?.id
          ? await updateEmployeeAction(employee.id, formData)
          : await createEmployeeAction(formData);

        if (result?.success) {
          setToastMessage({
            message: result.message || 'Employee saved successfully',
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
        title={employee ? 'Update Employee' : 'Add Employee'}
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
              form="employeeForm"
              type="submit"
              variant="primary"
              // leftIcon={<GoCheck />}
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
                ? employee
                  ? 'Updating'
                  : 'Creating'
                : employee
                  ? 'Update'
                  : 'Create'}
            </Button>
          </>
        }
      >
        <form
          id="employeeForm"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Name */}
          <CustomInput
            label="Full Name"
            placeholder="John Doe"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              label="Email"
              type="email"
              placeholder="johndoe@example.com"
              {...register('email', { required: 'Email is required' })}
              error={errors.email?.message}
            />

            <CustomInput
              label="Phone"
              placeholder="01234567890"
              {...register('phone', { required: 'Phone is required' })}
              error={errors.phone?.message}
            />
          </div>

          {/* Role + Status */}
          <div className="grid grid-cols-2 gap-3">
            <CustomSelector
              label="Role"
              options={roleOptions}
              {...register('role', { required: 'Role is required' })}
              error={errors.role?.message}
            />

            <CustomSelector
              label="Status"
              options={statusOptions}
              {...register('status', { required: 'Status is required' })}
              error={errors.status?.message}
            />
          </div>

          {/* Duty + Shift */}
          <div className="grid grid-cols-2 gap-3">
            <CustomSelector
              label="Duty Type"
              options={dutyTypeOptions}
              {...register('dutyType', {
                required: 'Duty type is required',
              })}
              error={errors.dutyType?.message}
            />

            <CustomSelector
              label="Shift"
              options={shiftOptions}
              {...register('shift', { required: 'Shift is required' })}
              error={errors.shift?.message}
            />
          </div>

          {/* Joining Date + Salary */}
          <div className="grid grid-cols-2 gap-3">
            <CustomInput
              label="Joining Date"
              type="date"
              {...register('joiningDate', {
                required: 'Joining date is required',
              })}
              error={errors.joiningDate?.message}
            />

            <CustomInput
              label="Monthly Salary"
              type="number"
              placeholder="500"
              {...register('monthlySalary', {
                required: 'Salary is required',
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: 'Salary must be positive',
                },
              })}
              error={errors.monthlySalary?.message}
            />
          </div>
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

export default EmployeeForm;
