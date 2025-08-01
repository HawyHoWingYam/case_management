import { Badge } from '@/components/ui/badge'
import { 
  CaseStatus, 
  CasePriority, 
  CASE_STATUS_CONFIG, 
  CASE_PRIORITY_CONFIG 
} from '@/types/case'
import { cn } from '@/lib/utils'

interface CaseStatusBadgeProps {
  status: CaseStatus
  className?: string
}

interface CasePriorityBadgeProps {
  priority: CasePriority
  className?: string
}

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
  const config = CASE_STATUS_CONFIG[status]
  
  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {status}
      </Badge>
    )
  }
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.color, className)}
    >
      {config.label}
    </Badge>
  )
}

export function CasePriorityBadge({ priority, className }: CasePriorityBadgeProps) {
  const config = CASE_PRIORITY_CONFIG[priority]
  
  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {priority}
      </Badge>
    )
  }
  
  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.color, className)}
    >
      {config.label}
    </Badge>
  )
}