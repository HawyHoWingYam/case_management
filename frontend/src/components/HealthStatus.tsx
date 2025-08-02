'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Database, 
  Server, 
  MemoryStick,
  Clock
} from 'lucide-react'
import { apiClient, HealthStatus as HealthStatusType, ApiInfo } from '@/lib/api'

function HealthStatusComponent() {
  const [healthData, setHealthData] = useState<HealthStatusType | null>(null)
  const [apiInfo, setApiInfo] = useState<ApiInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  // 添加调试日志
  useEffect(() => {
    console.log('🏥 [HealthStatus] Component mounted, starting health check')
    fetchHealthData()
    
    // 每30秒自动刷新
    const interval = setInterval(() => {
      console.log('🏥 [HealthStatus] Auto-refresh health data')
      fetchHealthData()
    }, 30000)
    
    return () => {
      console.log('🏥 [HealthStatus] Component unmounted, clearing interval')
      clearInterval(interval)
    }
  }, [])

  const fetchHealthData = async () => {
    console.log('🏥 [HealthStatus] Fetching health data...')
    setLoading(true)
    setError(null)
    
    try {
      const [healthResponse, infoResponse] = await Promise.all([
        apiClient.system.getHealth().catch((err) => {
          console.warn('🏥 [HealthStatus] Health endpoint failed:', err.message)
          return null
        }),
        apiClient.system.getInfo().catch((err) => {
          console.warn('🏥 [HealthStatus] Info endpoint failed:', err.message)
          return null
        })
      ])
      
      if (healthResponse?.data) {
        console.log('🏥 [HealthStatus] Health data received:', healthResponse.data)
        setHealthData(healthResponse.data)
      }
      
      if (infoResponse?.data) {
        console.log('🏥 [HealthStatus] API info received:', infoResponse.data)
        setApiInfo(infoResponse.data)
      }
      
      if (!healthResponse?.data && !infoResponse?.data) {
        throw new Error('无法连接到后端服务')
      }
      
      setLastChecked(new Date())
      console.log('🏥 [HealthStatus] Health check completed successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '连接失败'
      console.error('🏥 [HealthStatus] Health check failed:', errorMessage)
      setError(errorMessage)
      setHealthData(null)
      setApiInfo(null)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
      case 'connected':
        return <Badge variant="default" className="bg-green-500">正常</Badge>
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-500">降级</Badge>
      case 'error':
      case 'disconnected':
        return <Badge variant="destructive">错误</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`
    } else if (minutes > 0) {
      return `${minutes}分钟 ${secs}秒`
    } else {
      return `${secs}秒`
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              系统状态监控
            </CardTitle>
            <CardDescription>
              后端服务连接状态和系统健康信息
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealthData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !healthData && (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>正在检查系统状态...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">连接失败</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {healthData && (
          <div className="space-y-4">
            {/* 总体状态 */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon(healthData.status)}
                <span className="font-medium">总体状态</span>
              </div>
              {getStatusBadge(healthData.status)}
            </div>

            {/* 系统信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">运行时间</p>
                  <p className="text-sm font-medium">{formatUptime(healthData.uptime)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Server className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-xs text-muted-foreground">环境</p>
                  <p className="text-sm font-medium">{healthData.environment}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <MemoryStick className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-xs text-muted-foreground">内存使用</p>
                  <p className="text-sm font-medium">{healthData.memory.used} / {healthData.memory.total}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Server className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-xs text-muted-foreground">版本</p>
                  <p className="text-sm font-medium">v{healthData.version}</p>
                </div>
              </div>
            </div>

            {/* 服务状态 */}
            <div className="space-y-2">
              <h4 className="font-medium">服务状态</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="text-sm">数据库连接</span>
                    <span className="text-xs text-muted-foreground">
                      ({healthData.services.database.latency})
                    </span>
                  </div>
                  {getStatusBadge(healthData.services.database.status)}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span className="text-sm">API 服务</span>
                    <span className="text-xs text-muted-foreground">
                      ({healthData.services.api.responseTime})
                    </span>
                  </div>
                  {getStatusBadge(healthData.services.api.status)}
                </div>
              </div>
            </div>

            {/* API 信息 */}
            {apiInfo && (
              <div className="space-y-2">
                <h4 className="font-medium">API 信息</h4>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium">{apiInfo.name}</p>
                  <p className="text-sm text-muted-foreground">{apiInfo.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">v{apiInfo.version}</Badge>
                    <Badge variant="outline">{apiInfo.environment}</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* 最后检查时间 */}
            {lastChecked && (
              <div className="text-xs text-muted-foreground text-center">
                最后检查: {lastChecked.toLocaleString('zh-CN')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// 同时提供默认导出和命名导出
export default HealthStatusComponent
export { HealthStatusComponent as HealthStatus }