"use client";

import React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import Button from "../shared ui/Button";
import { ImSpinner2 } from "react-icons/im";

type FormValues = {
  email: string;
  password: string;
};

function Signin() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    try {
      const { email, password } = data;

      const { data: sessionData, error } = await authClient.signIn.email({ email, password });

      if (error) {
        toast.error(error.message || "Sign in failed");
        return;
      }

      // Add a small delay to ensure the session cookie is fully set by the browser
      // before navigating. This prevents race condition on first login.
      await new Promise(resolve => setTimeout(resolve, 150));

      // Use window.location.href for full page reload to ensure the session cookie
      // is sent with the next request. This fixes the first-time login routing issue.
      window.location.href = "/dashboard-overview";
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left image section */}
      <div className="flex-1 relative hidden md:block">
        <Image
          src="/images/signin-background.png"
          alt="Sign In Background"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-white"></div>
      </div>

      {/* Form section */}
      <div className="w-full md:w-[480px] flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-12">
            <h1 className="text-[28px] font-bold text-[#4a90e2]">
              Pharmino
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-[#27272A] mb-2 text-[14px]">Email</label>
              <input
                type="email"
                placeholder="Enter Email"
                {...register("email", { required: "Email is required", pattern: { value: /\S+@\S+\.\S+/, message: "Invalid email address" } })}
                className="w-full px-4 py-2 bg-[#F1F5F9] rounded-[28px] border-0 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] text-gray-800 placeholder-gray-400"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-[#27272A] mb-2 text-[14px]">Password</label>
              <input
                type="password"
                placeholder="Enter Password"
                {...register("password", { required: "Password is required", minLength: { value: 6, message: "Minimum 6 characters" } })}
                className="w-full px-4 py-2 bg-[#F1F5F9] rounded-[28px] border-0 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] text-gray-800 placeholder-gray-400"
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit Button */}
            <Button type="submit" variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  Signing in
                  <ImSpinner2 className="animate-spin ml-1" />
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Signin;

