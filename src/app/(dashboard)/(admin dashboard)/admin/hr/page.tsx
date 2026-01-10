import { redirect } from "next/navigation";

export default function HRManagementPage() {
  // Redirect to categories by default
  redirect("/admin/hr/directory");
}