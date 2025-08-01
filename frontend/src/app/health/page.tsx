import { Metadata } from 'next'
import { AppShell } from '@/components/layout/app-shell'
import { HealthDashboard } from '@/components/features/health/health-dashboard'

export const metadata: Metadata = {
  title: 'System Health',
  description: 'Monitor system health and component status',
}

export default function HealthPage() {
  return (
    <AppShell>
      <HealthDashboard />
    </AppShell>
  )
}