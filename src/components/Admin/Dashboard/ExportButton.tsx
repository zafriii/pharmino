"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import Button from "@/components/shared ui/Button";

interface ExportButtonProps {
  className?: string;
}

export default function ExportButton({ className = "" }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const searchParams = useSearchParams();

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      // Build query parameters from current filters
      const queryParams = new URLSearchParams();
      const period = searchParams.get('period');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      
      if (period) queryParams.set('period', period);
      if (startDate) queryParams.set('startDate', startDate);
      if (endDate) queryParams.set('endDate', endDate);
      
      const queryString = queryParams.toString();
      const exportUrl = `/api/admin/dashboard/export${queryString ? `?${queryString}` : ''}`;
      
      // Fetch dashboard data for export
      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Try to get error details from the response
        let errorMessage = 'Failed to export data';
        try {
          const errorData = await response.json();
          errorMessage = errorData.details || errorData.error || `Server error: ${response.status} ${response.statusText}`;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      link.download = `dashboard-data-${dateStr}.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export failed:', error);
      
      let errorMessage = 'Failed to export data. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
     variant="primary"
      onClick={handleExport}
      disabled={isExporting}
      className={`
        inline-flex items-center gap-2 px-4 py-2             
        disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export
        </>
      )}
    </Button>
  );
}