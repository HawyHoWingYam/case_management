'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useHealthCheck } from '@/hooks/use-health'
import { HealthStatusCard } from './health-status-card'
import { RefreshCw, Activity, Database, MemoryStick, Wifi, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export function HealthDashboard() {
  const { basic, detailed, refetchAll, isLoading, hasError, isHealthy } = useHealthCheck()

  const handleRefresh = async () => {
    try {
      await refetchAll()
      toast.success('Health status refreshed')
    } catch (error) {
      toast.error('Failed to refresh health status')
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      return `${days}d ${remainingHours}h`
    }
    
    return `${hours}h ${minutes}m`
  }

  const formatMemoryUsage = (used: number, total: number) => {
    const percentage = Math.round((used / total) * 100)
    return {
      percentage,
      display: `${used}/${total} MB`,
      status: percentage > 90 ? 'critical' : percentage > 75 ? 'warning' : 'ok'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        
        <Skeleton className="h-48" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">
            Monitor the health and status of all system components
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* Overall health indicator */}
          <div className="flex items-center space-x-2">
            {isHealthy ? (
              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Healthy</span>
              </div>
            ) : hasError ? (
              <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">Issues</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-yellow-600 dark:text-yellow-400">
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Checking</span>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* System Status */}
        <HealthStatusCard
          title="System Status"
          icon={<Activity className="h-4 w-4" />}
          status={basic.data?.status || 'unknown'}
          value={basic.data?.status === 'ok' ? 'Healthy' : 'Issues Detected'}
          description={
            basic.data?.uptime 
              ? `Uptime: ${formatUptime(basic.data.uptime)}`
              : 'No uptime data'
          }
        />

        {/* Database Status */}
        {detailed.data?.services?.database && (
          <HealthStatusCard
            title="Database"
            icon={<Database className="h-4 w-4" />}
            status={detailed.data.services.database.status}
            value={
              detailed.data.services.database.status === 'connected' 
                ? 'Connected' 
                : 'Disconnected'
            }
            description={
              detailed.data.services.database.responseTime
                ? `Response: ${detailed.data.services.database.responseTime}ms`
                : 'No response time available'
            }
          />
        )}

        {/* Memory Usage */}
        {detailed.data?.services?.memory && (
          (() => {
            const memory = formatMemoryUsage(
              detailed.data.services.memory.used,
              detailed.data.services.memory.total
            )
            return (
              <HealthStatusCard
                title="Memory Usage"
                icon={<MemoryStick className="h-4 w-4" />}
                status={memory.status}
                value={`${memory.percentage}%`}
                description={memory.display}
              />
            )
          })()
        )}

        {/* Last Updated */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {basic.data?.timestamp 
                ? new Date(basic.data.timestamp).toLocaleTimeString()
                : 'N/A'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {basic.data?.timestamp 
                ? new Date(basic.data.timestamp).toLocaleDateString()
                : 'No data available'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* n8n Integration Test Section */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Tests</CardTitle>
          <CardDescription>
            Test the connection between frontend, backend, and automation systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button 
              variant="outline" 
              onClick={() => {
                toast.info('n8n connection test not yet implemented')
              }}
            >
              <Activity className="mr-2 h-4 w-4" />
              Test n8n Connection
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                toast.info('Database connection test not yet implemented')
              }}
            >
              <Database className="mr-2 h-4 w-4" />
              Test Database Connection
            </Button>
          </div>
          
          {/* Test Results */}
          <div className="rounded-lg border p-4 text-sm">
            <div className="font-medium mb-2">Integration Status</div>
            <div className="space-y-1 text-muted-foreground">
              <div>• Backend API: {basic.data ? '✅ Connected' : '❌ Disconnected'}</div>
              <div>• Database: {detailed.data?.services?.database?.status === 'connected' ? '✅ Connected' : '❌ Disconnected'}</div>
              <div>• n8n Workflows: ⏳ Testing not implemented</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}