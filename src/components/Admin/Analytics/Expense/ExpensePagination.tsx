"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import Pagination from "@/components/shared ui/Pagination";

export default function ExpensePagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}


