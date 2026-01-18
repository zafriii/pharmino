import DashboardWrapper from "@/components/Admin/Dashboard/DashboardWrapper";
import ExportButton from "@/components/Admin/Dashboard/ExportButton";
import DashboardDataFilter from "@/components/Admin/Dashboard/DashboardDataFilter";

interface PageProps {
  searchParams: Promise<{
    period?: string;
    startDate?: string;
    endDate?: string;
    todayStart?: string;
    todayEnd?: string;
  }>;
}

export default async function DashboardOverviewPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 p-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <DashboardDataFilter />
            <div className="flex-shrink-0">
              <ExportButton />
            </div>
          </div>
        </div>
        <DashboardWrapper searchParams={resolvedParams} />
      </div>
    </div>
  );
}