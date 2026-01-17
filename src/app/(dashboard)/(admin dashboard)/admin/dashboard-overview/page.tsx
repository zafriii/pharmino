import DashboardWrapper from "@/components/Admin/Dashboard/DashboardWrapper";

export default function DashboardOverviewPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="">
          <h1 className="text-3xl font-bold text-gray-900 p-6">Dashboard Overview</h1>         
        </div>        
        <DashboardWrapper />
      </div>
    </div>
  );
}