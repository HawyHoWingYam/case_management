'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface HealthStatusCardProps {
  title: string
  icon: ReactNode
  status: string
  value: string | number
  description?: string
  className?: string
}

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'ok':
    case 'healthy':
    case 'connected':
    case 'online':
      return 'default' as const
    case 'warning':
    case 'degraded':
      return 'secondary' as const
    case 'error':
    case 'critical':
    case 'offline':
    case 'disconnected':
      return 'destructive' as const
    case 'info':
    case 'unknown':
    default:
      return 'outline' as const
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'ok':
    case 'healthy':
    case 'connected':
    case 'online':
      return 'text-green-600 dark:text-green-400'
    case 'warning':
    case 'degraded':
      return 'text-yellow-600 dark:text-yellow-400'
    case 'error':
    case 'critical':
    case 'offline':
    case 'disconnected':
      return 'text-red-600 dark:text-red-400'
    case 'info':
    case 'unknown':
    default:
      return 'text-blue-600 dark:text-blue-400'
  }
}

export function HealthStatusCard({
  title,
  icon,
  status,
  value,
  description,
  className
}: HealthStatusCardProps) {
  const statusVariant = getStatusVariant(status)
  const statusColor = getStatusColor(status)

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("h-4 w-4", statusColor)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{value}</div>
          
          <div className="flex items-center justify-between">
            <Badge variant={statusVariant} className="text-xs">
              {status}
            </Badge>
          </div>
          
          {description && (
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}