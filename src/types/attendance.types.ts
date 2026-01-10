export interface Attendance {
  id: number;
  userId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  createdAt: string;
  updatedAt: string;
}

// export interface AttendanceWithEmployee extends Attendance {
//   user: {
//     id: string;
//     name: string;
//     email: string;
//     phone: string;
//     role: "ADMIN" | "COUNTER" | "KITCHEN" | "WAITER" | "DELIVERY";
//     status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
//     shift: "DAY" | "NIGHT";
//     dutyType: "FULL_TIME" | "PART_TIME";
//   };
// }

export interface EmployeeWithAttendance {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "COUNTER" | "KITCHEN" | "WAITER" | "DELIVERY";
  status: "ACTIVE" | "ON_LEAVE" | "INACTIVE";
  dutyType: "FULL_TIME" | "PART_TIME";
  shift: "DAY" | "NIGHT";
  joiningDate: string;
  monthlySalary: number;
  imageUrl?: string | null;
  attendance?: Attendance;
}