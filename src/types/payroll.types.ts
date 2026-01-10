export interface Payroll {
  id: number;
  userId: string;
  baseSalary: string;
  allowances: string;
  deductions: string;
  netPay: string;
  paymentStatus: "PENDING" | "PAID";
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    image?: string;
  };
}

export interface PayrollResponse {
  payrolls: Payroll[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats?: {
    totalPayrolls: number;
    totalBaseSalary: string;
    totalAllowances: string;
    totalDeductions: string;
    totalNetPay: string;
    pendingPayrolls: number;
    paidPayrolls: number;
  };
}

export interface PayrollFilters {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  month?: string;
  userId?: string;
}