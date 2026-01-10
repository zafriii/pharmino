"use client";

import React, { useState, useTransition } from "react";
import { Employee } from "@/types/employees.types";
import Button from "@/components/shared ui/Button";
import EditButton from "@/components/shared ui/EditButton";
import Toast from "@/components/shared ui/Toast";
import { useForm } from "react-hook-form";
import { setPasswordAction } from "@/actions/setPassword.action";
import EmployeePagination from "../Directory/EmployeePagination";

interface Props {
  employees: Employee[];
  totalPages: number;
  currentPage: number;
}

interface FormValues {
  password: string;
  confirmPassword: string;
}

export default function SetPassword({
  employees,
  totalPages,
  currentPage,
}: Props) {
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error" | "fail"; message: string } | null>(null);

  const grouped: Record<string, Employee[]> = {};
  employees.forEach((emp) => {
    const r = emp.role || "UNKNOWN";
    if (!grouped[r]) grouped[r] = [];
    grouped[r].push(emp);
  });

  // RHF setup
  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: { password: "", confirmPassword: "" },
  });


    const getErrorMessage = (resMessage: any) => {
    if (typeof resMessage === "string") return resMessage;
    return "Something went wrong";
    };


  const submit = async (id: string, data: FormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("password", data.password);
        formData.append("confirmPassword", data.confirmPassword);

        const res = await setPasswordAction(id, formData);

        if (!res.success) {
          setToastMessage({ type: res.message.includes("failed") ? "fail" : "error", message: getErrorMessage(res.message) });
          return;
        }

        setToastMessage({ type: "success", message: "Password updated successfully" });
        setVisible((s) => ({ ...s, [id]: false }));
        reset();
      } catch (err: any) {
        setToastMessage({ type: "fail", message: err.message || "Something went wrong" });
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {Object.keys(grouped).map((role) => (

          //Users Card for setting password

          <div key={role} className="border border-[#E5E5E5] rounded-xl p-5 bg-white">
            <div className="inline-block bg-[#F1F5F9] text-black px-3 py-1 rounded-full text-sm font-medium">
              {role}
            </div>
            <p className="mt-2 text-gray-700 text-sm">{grouped[role].length} Users</p>

            <div className="mt-4 space-y-4">
              {grouped[role].map((emp) => (
                <form
                  key={emp.id}
                  onSubmit={handleSubmit((data) => submit(emp.id, data))}
                  className="bg-[#F1F5F9] p-3 rounded-lg flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-gray-500">{emp.email}</p>
                    </div>
                    <EditButton
                      ariaLabel=""
                      variant="ghost"
                      onClick={() => setVisible((v) => ({ ...v, [emp.id]: !v[emp.id] }))}
                    />
                  </div>

                  {/* Password & Confirm password */}

                  {visible[emp.id] && (
                    <>
                      <input
                        type="password"
                        placeholder="Password"
                        className="bg-white border border-gray-300 rounded-full px-3 py-2 text-sm"
                        {...register("password", { required: "Password is required" })}
                      />
                      {formState.errors.password && (
                        <p className="text-red-500 text-xs">{formState.errors.password.message}</p>
                      )}

                      <input
                        type="password"
                        placeholder="Confirm Password"
                        className="bg-white border border-gray-300 rounded-full px-3 py-2 text-sm"
                        {...register("confirmPassword", { required: "Confirm Password is required" })}
                      />
                      {formState.errors.confirmPassword && (
                        <p className="text-red-500 text-xs">{formState.errors.confirmPassword.message}</p>
                      )}

                      <Button type="submit" variant="primary" disabled={pending}>
                        {pending ? "Saving..." : "Set Password"}
                      </Button>
                    </>
                  )}
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-end">
        <EmployeePagination currentPage={currentPage} totalPages={totalPages} />
      </div>

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

