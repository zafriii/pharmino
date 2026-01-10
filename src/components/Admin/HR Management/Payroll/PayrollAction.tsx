"use client";

import React, { useState, useTransition } from "react";
import DownloadButton from "@/components/shared ui/DownloadButton";
import MarkButton from "@/components/shared ui/MarkButton";
import PayrollStats from "./PayrollStats";
import { markPayrollPaidAction, fetchEmployeePayrollStatsAction } from "@/actions/payroll.actions";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import { Payroll, PayrollResponse } from "@/types/payroll.types";
import ViewButton from "@/components/shared ui/ViewButton";

// Convert image to Base64
const convertImageToBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Error converting image to base64:`, error);
    return "";
  }
};

interface PayrollActionProps {
  payroll: Payroll;
  disabled?: boolean;
}

export default function PayrollAction({ payroll, disabled }: PayrollActionProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [employeeStats, setEmployeeStats] = useState<PayrollResponse["stats"] |  undefined>(undefined);;
  const [loadingStats, setLoadingStats] = useState(false);

  const formatNumber = (num: number | string): string => {
    const n = Number(num);
    return isNaN(n) ? String(num) : n.toLocaleString("en-US");
  };

  // Fetch employee-specific stats using server action
  const fetchEmployeeStats = async (userId: string) => {
    try {
      setLoadingStats(true);
      const result = await fetchEmployeePayrollStatsAction(userId);
      
      if (result.success) {
        setEmployeeStats(result.stats || undefined);
      } else {
        console.error(result.error);
        setEmployeeStats(undefined);
      }
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      setEmployeeStats(undefined);
    } finally {
      setLoadingStats(false);
    }
  };

  // Handle stats modal open
  const handleStatsModalOpen = () => {
    setIsStatsModalOpen(true);
    fetchEmployeeStats(payroll.userId);
  };

  // Mark payroll as paid
  const handleMarkPaid = () => {
    startTransition(async () => {
      const result = await markPayrollPaidAction(payroll.id.toString());
      if (result.success) router.refresh();
      else console.error(result.error);
    });
  };

  // Download Payroll PDF
  const handleDownload = async () => {
    try {
      setDownloading(true);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginLeft = 20;
      const marginRight = 20;

      let currentY = 20;

      // Logo 

      const logoWidth = 35;
      const logoHeight = 22;
      const centerX = (pageWidth - logoWidth) / 2;

      const logoBase64 = await convertImageToBase64("/images/pharmacy-logo.png");

      if (logoBase64) {
        try {
          doc.addImage(logoBase64, "PNG", centerX, 10, logoWidth, logoHeight);
        } catch (e) {
          console.error("Logo error:", e);
        }
      }

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Payslip", pageWidth / 2, 40, { align: "center" });

      currentY = 55;

      // Employee Details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const leftColX = marginLeft;
      const rightColX = pageWidth / 2 + 10;

      doc.text(`Pay Period : ${new Date(payroll.createdAt).toLocaleDateString()}`, leftColX, currentY);
      doc.text(`Employee Name : ${payroll.user.name}`, rightColX, currentY);
      currentY += 6;

      doc.text(`Status : ${payroll.paymentStatus}`, leftColX, currentY);
      doc.text(`Role : ${payroll.user.role}`, rightColX, currentY);
      currentY += 6;

      doc.text(`Email : ${payroll.user.email}`, leftColX, currentY);
      doc.text(`Employee ID : ${payroll.user.id}`, rightColX, currentY);
      currentY += 6;

      doc.text(`Phone : ${payroll.user.phone}`, leftColX, currentY);

      currentY += 15;

      // Table Header
      const col1X = marginLeft;
      const col2X = marginLeft + 55;
      const col3X = pageWidth / 2 + 5;
      const col4X = pageWidth / 2 + 60;

      doc.setFont("helvetica", "bold");
      doc.text("Earnings", col1X, currentY);
      doc.text("Amount", col2X, currentY);
      doc.text("Deductions", col3X, currentY);
      doc.text("Amount", col4X, currentY);

      currentY += 3;
      doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
      currentY += 8;

      // Table Rows
      doc.setFont("helvetica", "normal");

      doc.text("Base Salary", col1X, currentY);
      doc.text(formatNumber(payroll.baseSalary), col2X, currentY);

      doc.text("Deductions", col3X, currentY);
      doc.text(formatNumber(payroll.deductions), col4X, currentY);

      currentY += 8;

      doc.text("Allowances", col1X, currentY);
      doc.text(formatNumber(payroll.allowances), col2X, currentY);

      currentY += 10;

      const totalEarnings =
        Number(payroll.baseSalary) + Number(payroll.allowances);

      doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
      currentY += 7;

      doc.setFont("helvetica", "bold");
      doc.text("Total Earnings", col1X, currentY);
      doc.text(formatNumber(totalEarnings), col2X, currentY);

      doc.text("Total Deductions", col3X, currentY);
      doc.text(formatNumber(payroll.deductions), col4X, currentY);

      currentY += 10;
      doc.line(marginLeft, currentY, pageWidth - marginRight, currentY);
      currentY += 10;

      // Net Pay
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Net Pay:", col1X, currentY);
      doc.text(formatNumber(payroll.netPay), col2X, currentY);

      currentY += 20;

      doc.text(formatNumber(payroll.netPay), pageWidth / 2, currentY, {
        align: "center",
      });

      currentY += 25;

      // Signatures
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Employer Signature", leftColX, currentY);
      doc.text("Employee Signature", rightColX + 15, currentY);

      currentY += 12;
      doc.line(leftColX, currentY, leftColX + 50, currentY);
      doc.line(rightColX + 15, currentY, rightColX + 70, currentY);

      // Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.text(
        "This is a computer-generated payroll slip.",
        pageWidth / 2,
        285,
        { align: "center" }
      );

      // Save PDF
      const fileName = `payroll_${payroll.user.name.replace(
        /\s+/g,
        "_"
      )}_${new Date(payroll.createdAt).toISOString().slice(0, 7)}.pdf`;

      doc.save(fileName);
      setDownloading(false);
    } catch (err) {
      console.error("PDF Error:", err);
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {/* View Stats Button */}       
        <ViewButton
          onClick={handleStatsModalOpen}
          disabled={disabled || isPending || downloading}
          aria-label="View payroll statistics"                   
        />
        
        {/* Download payroll slip */}
        <DownloadButton
          ariaLabel="Download payroll slip"
          disabled={disabled || isPending || downloading}
          onClick={handleDownload}
        />

        {/* Mark paid */}
        {payroll.paymentStatus === "PENDING" && (
          <MarkButton
            ariaLabel="Mark payroll as paid"
            variant="secondary"
            title="Mark payment"
            disabled={disabled || isPending}
            onClick={handleMarkPaid}
          />
        )}
      </div>

      {/* Stats Modal */}
      <PayrollStats
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={employeeStats}
        loading={loadingStats}
        employeeName={payroll.user.name}
      />
    </>
  );
}