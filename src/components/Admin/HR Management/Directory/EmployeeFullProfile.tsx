import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shared ui/Card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/shared ui/Avatar";
import {
  Mail,
  Phone,
  Calendar,
  Shield,
  Clock,
  Briefcase,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Activity,
  CreditCard,
  History,
} from "lucide-react";

interface EmployeeData {
  employee: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    dutyType: string;
    shift: string;
    status: string;
    imageUrl?: string;
    address?: string;
    emergencyContact?: string;
    joiningDate?: string;
    attendances: Array<{
      id: number;
      date: string;
      status: string;
      createdAt: string;
    }>;
    payrolls: Array<{
      id: number;
      baseSalary: string;
      allowances: string;
      deductions: string;
      netPay: string;
      paymentStatus: string;
      createdAt: string;
    }>;
    auditLogs: Array<{
      id: number;
      action: string;
      entity: string;
      entityId: string;
      createdAt: string;
    }>;
    statistics: {
      attendance: {
        present: number;
        absent: number;
        late: number;
        total: number;
      };
      payroll: {
        totalEarned: number;
        totalPending: number;
        paidCount: number;
        pendingCount: number;
      };
      activityCount: number;
    };
  };
}

async function fetchEmployeeProfile(id: string): Promise<EmployeeData | null> {
  try {
    const cookieStore = await cookies();
    // const sessionToken = cookieStore.get("better-auth.session_token")?.value;
    const cookieHeader = cookieStore.toString()
    const baseUrl = process.env.BETTER_AUTH_URL;

    const response = await fetch(`${baseUrl}/api/admin/employees/${id}/full`, {
      next: {
        revalidate: 60,
        tags: ["employee-profile", `employee-${id}`],
      },
      headers: {
        "Content-Type": "application/json",
        // ...(sessionToken ? { Cookie: `better-auth.session_token=${sessionToken}` } : {}),
        Cookie:cookieHeader
      },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch employee profile: ${response.status}`);
    }

    const data = await response.json();
    return data as EmployeeData;
  } catch (error) {
    console.error("Fetch Employee Profile Error:", error);
    return null;
  }
}

// Helper functions 
const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "PAID":
    case "PRESENT":
      return "bg-green-100 text-green-800";
    case "PENDING":
    case "LATE":
      return "bg-yellow-100 text-yellow-800";
    case "INACTIVE":
    case "ABSENT":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (amount: string | number) => {
  const numAmount = Number(amount);
  return `${numAmount.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};


export default async function EmployeeFullProfile({ employeeId }: { employeeId: string }) {
  const profileData = await fetchEmployeeProfile(employeeId);

  if (!profileData) notFound();

  const { employee } = profileData;
  const stats = employee.statistics;

  return (
    <div className="container mx-auto p-6 space-y-6 min-h-screen">

      {/* Employee information */}
      <Card className="bg-white border border-gray-200 rounded-xl">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={employee.imageUrl} alt={employee.name} />
              <AvatarFallback className="text-[40px] font-semibold text-white">
                {employee.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-800">{employee.name}</h1>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.status)}`}>
                    {employee.status}
                  </span>
                </div>
                <p className="text-gray-500 mt-1">Employee ID: {employee.id}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4 text-[#4a90e2]" />
                  <span>{employee.email}</span>
                </div>

                {employee.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-[#4a90e2]" />
                    {employee.phone}
                  </div>
                )}

                <div className="flex items-center gap-2 text-gray-700">
                  <Shield className="h-4 w-4 text-[#4a90e2]" />
                  {employee.role}
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Briefcase className="h-4 w-4 text-[#4a90e2]" />
                  {employee.dutyType}
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="h-4 w-4 text-[#4a90e2]" />
                  {employee.shift}
                </div>

                {employee.joiningDate && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-[#4a90e2]" />
                    Joined {formatDate(employee.joiningDate)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Present",
            value: stats.attendance.present,
            icon: <CheckCircle2 className="h-4 w-4 text-[#4a90e2]" />,
            sub: stats.attendance.total > 0
              ? `${((stats.attendance.present / stats.attendance.total) * 100).toFixed(1)}% attendance`
              : "0% attendance",
          },
          {
            label: "Absent",
            value: stats.attendance.absent,
            icon: <XCircle className="h-4 w-4 text-red-500" />,
            sub: stats.attendance.total > 0
              ? `${((stats.attendance.absent / stats.attendance.total) * 100).toFixed(1)}% of total`
              : "0%",
          },
          {
            label: "Total Earned",
            value: formatCurrency(stats.payroll.totalEarned),
            icon: <DollarSign className="h-4 w-4 text-[#4a90e2]" />,
            // sub: `${stats.payroll.paidCount }  payments `,
            sub: `${stats.payroll.paidCount} ${stats.payroll.paidCount === 1 ? "payment" : "payments"}`
          },
          {
            label: "Activities",
            value: stats.activityCount,
            icon: <Activity className="h-4 w-4 text-[#4a90e2]" />,
            sub: "Total actions logged",
          },
        ].map((s, i) => (
          <Card key={i} className="bg-white rounded-xl shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{s.label}</CardTitle>
              {s.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">{s.value}</div>
              <p className="text-xs text-gray-500">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ATTENDANCE */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[#4a90e2]" />
            <CardTitle className="text-xl text-gray-800">Attendance History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employee.attendances.length > 0 ? (
              employee.attendances.slice(0, 10).map((attendance) => (
                <div
                  key={attendance.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    {attendance.status === "PRESENT" && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    )}
                    {attendance.status === "ABSENT" && (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    {attendance.status === "LATE" && (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{formatDate(attendance.date)}</p>
                      <p className="text-sm text-gray-500">
                        Marked at {new Date(attendance.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(attendance.status)}`}>
                    {attendance.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No attendance records</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/*PAYROLL */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#4a90e2]" />
            <CardTitle className="text-xl text-gray-800">Payroll History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employee.payrolls.length > 0 ? (
              employee.payrolls.slice(0, 10).map((payroll) => (
                <div
                  key={payroll.id}
                  className="p-4 rounded-lg bg-gray-50 border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-[#4a90e2]" />
                      <span className="font-medium text-gray-800">{formatDate(payroll.createdAt)}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payroll.paymentStatus)}`}>
                      {payroll.paymentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Base Salary</p>
                      <p className="font-medium text-gray-800">{formatCurrency(payroll.baseSalary)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Allowances</p>
                      <p className="font-medium text-green-600">+{formatCurrency(payroll.allowances)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Deductions</p>
                      <p className="font-medium text-red-600">-{formatCurrency(payroll.deductions)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Net Pay</p>
                      <p className="font-bold text-gray-800">{formatCurrency(payroll.netPay)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No payroll records</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/*ACTIVITY LOG*/}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-[#4a90e2]" />
            <CardTitle className="text-xl text-gray-800">Activity Log</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employee.auditLogs.length > 0 ? (
              employee.auditLogs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-200 shadow-sm"
                >
                  <Activity className="h-5 w-5 text-emerald-600 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">{log.action}</p>
                      <span className="text-xs text-gray-500">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {log.entity} • {log.entityId}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No activity logs</p>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
