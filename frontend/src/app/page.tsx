import { AppShell } from "@/components/layout/app-shell";
import { HealthDashboard } from "@/components/features/health/health-dashboard";

export default function Home() {
  return (
    <AppShell>
      <HealthDashboard />
    </AppShell>
  );
}
