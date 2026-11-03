import { getAccess } from "@/lib/users/access";
import { AppSidebarNav } from "./AppSidebarNav.client";

export default async function SidebarNavigation() {
  const { role } = await getAccess();
  return <AppSidebarNav isAdmin={role === "admin"} />;
}
