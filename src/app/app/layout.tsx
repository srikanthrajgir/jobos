import DashboardShell from "@/components/DashboardShell";
import { createClient } from "@/utils/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <DashboardShell userEmail={user?.email}>{children}</DashboardShell>;
}
