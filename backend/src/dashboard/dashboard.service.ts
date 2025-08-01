import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(user: any) {
    const totalCases = await this.prisma.case.count()
    const myCases = await this.prisma.case.count({
      where: { created_by: user.user_id }
    })
    const assignedCases = await this.prisma.case.count({
      where: { assigned_to: user.user_id }
    })
    
    const statusStats = await this.prisma.case.groupBy({
      by: ['status'],
      _count: true
    })

    return {
      totalCases,
      myCases,
      assignedCases,
      statusBreakdown: statusStats.map(stat => ({
        status: stat.status,
        count: stat._count
      }))
    }
  }

  async getRecentActivity(user: any) {
    const recentLogs = await this.prisma.caseLog.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { username: true }
        },
        case: {
          select: { title: true }
        }
      }
    })

    return {
      activities: recentLogs.map(log => ({
        id: log.log_id,
        action: log.action,
        details: log.details,
        user: log.user.username,
        caseTitle: log.case.title,
        timestamp: log.created_at
      }))
    }
  }

  async getMyTasks(user: any) {
    const myTasks = await this.prisma.case.findMany({
      where: {
        OR: [
          { created_by: user.user_id },
          { assigned_to: user.user_id }
        ],
        status: {
          not: 'CLOSED'
        }
      },
      take: 5,
      orderBy: { updated_at: 'desc' },
      include: {
        creator: {
          select: { username: true }
        }
      }
    })

    return {
      tasks: myTasks.map(task => ({
        id: task.case_id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        createdBy: task.creator.username,
        updatedAt: task.updated_at
      }))
    }
  }
}