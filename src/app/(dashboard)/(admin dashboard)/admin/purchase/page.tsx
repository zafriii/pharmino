import { redirect } from "next/navigation";

export default function MenuManagementPage() {
  // Redirect to categories by default
  redirect("/admin/purchase/purchase-list");
}