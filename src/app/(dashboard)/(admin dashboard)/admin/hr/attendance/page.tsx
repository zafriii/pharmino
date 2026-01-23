import React, { Suspense } from "react";
import FetchAttendance from "@/components/HR Management/Attendance/FetchAttendance";
import AttendanceWrapper from "@/components/HR Management/Attendance/AttendanceWrapper";
import PageContainer from "@/components/shared ui/PageContainer";
import HRTabs from "@/components/HR Management/HRTabs";
import Load from "@/components/Load";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    date?: string;
  }>;
}

export default async function AttendancePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <PageContainer title="Human Resource Management">
      <HRTabs />

      {/* Search + Date Filter */}
      <AttendanceWrapper />

      {/* Attendance List with Suspense */}     
        <FetchAttendance searchParams={resolvedParams} />      
    </PageContainer>
  );
}