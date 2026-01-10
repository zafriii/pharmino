import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/get-session";
import DashboardContent from "./DashboardContent";

interface Props {
  children: ReactNode;
}

export default async function DashboardWrapper({ children }: Props) {
  // Server-side session check
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/signin"); // Redirect immediately if not logged in
  }

  return <DashboardContent>{children}</DashboardContent>;
}
