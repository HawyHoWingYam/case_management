import { Controller, Get, UseGuards, Request } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { DashboardService } from './dashboard.service'

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@Request() req) {
    return this.dashboardService.getStats(req.user)
  }

  @Get('recent-activity')
  async getRecentActivity(@Request() req) {
    return this.dashboardService.getRecentActivity(req.user)
  }

  @Get('my-tasks')
  async getMyTasks(@Request() req) {
    return this.dashboardService.getMyTasks(req.user)
  }
}