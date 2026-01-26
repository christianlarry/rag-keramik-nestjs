import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma/prisma.service";
import { AuditAction, AuditTargetType } from "src/generated/prisma/enums";
import { AuditLogWhereInput, TransactionClient } from "src/generated/prisma/internal/prismaNamespace";
import { ICreateAuditLog } from "./interfaces/create-audit-log.interface";
import { IAuditLogQueryParams } from "./interfaces/audit-log-query-params.interface";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prismaService: PrismaService) { }

  /**
   * Create audit log entry
   * @param data - Audit log data
   * @param tx - Optional Prisma transaction client
   * @returns Created audit log
   */
  async create(
    data: ICreateAuditLog,
    tx?: TransactionClient
  ) {
    const prisma = tx ?? this.prismaService;

    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          actorId: data.actorId,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          metadata: data.metadata,
        },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      this.logger.log(
        `Audit log created: ${data.action} by ${data.actorId || 'system'}`
      );

      return auditLog;
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Create multiple audit log entries
   * @param dataList - Array of audit log data
   * @param tx - Optional Prisma transaction client
   * @returns Count of created audit logs
   */
  async createMany(
    dataList: ICreateAuditLog[],
    tx?: TransactionClient
  ) {
    const prisma = tx ?? this.prismaService;

    try {
      const result = await prisma.auditLog.createMany({
        data: dataList.map(data => ({
          actorId: data.actorId,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          metadata: data.metadata,
        })),
        skipDuplicates: false,
      });

      this.logger.log(`Created ${result.count} audit log entries`);

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create multiple audit logs: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Find audit logs with filters and pagination
   * @param params - Query parameters
   * @returns Paginated audit logs
   */
  async findMany(params: IAuditLogQueryParams = {}) {
    const {
      actorId,
      action,
      targetType,
      targetId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = params;

    const skip = (page - 1) * limit;

    const where: AuditLogWhereInput = {};

    if (actorId) where.actorId = actorId;
    if (action) where.action = action;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    try {
      const [data, total] = await Promise.all([
        this.prismaService.auditLog.findMany({
          where,
          include: {
            actor: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prismaService.auditLog.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch audit logs: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Find audit log by ID
   * @param id - Audit log ID
   * @returns Audit log or null
   */
  async findById(id: string) {
    try {
      return await this.prismaService.auditLog.findUnique({
        where: { id },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch audit log: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get audit logs for a specific user
   * @param userId - User ID
   * @param limit - Maximum number of records
   * @returns User's audit logs
   */
  async findByUserId(userId: string, limit: number = 50) {
    try {
      return await this.prismaService.auditLog.findMany({
        where: { actorId: userId },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch user audit logs: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get audit logs for a specific target
   * @param targetType - Target type
   * @param targetId - Target ID
   * @param limit - Maximum number of records
   * @returns Target's audit logs
   */
  async findByTarget(
    targetType: AuditTargetType,
    targetId: string,
    limit: number = 50
  ) {
    try {
      return await this.prismaService.auditLog.findMany({
        where: {
          targetType,
          targetId,
        },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch target audit logs: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get audit statistics by action
   * @param startDate - Start date for filtering
   * @param endDate - End date for filtering
   * @returns Grouped statistics by action
   */
  async getStatsByAction(startDate?: Date, endDate?: Date) {
    const where: AuditLogWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    try {
      return await this.prismaService.auditLog.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch audit stats: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get audit statistics by user
   * @param startDate - Start date for filtering
   * @param endDate - End date for filtering
   * @returns Grouped statistics by user
   */
  async getStatsByUser(startDate?: Date, endDate?: Date) {
    const where: AuditLogWhereInput = {
      actorId: { not: null },
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    try {
      return await this.prismaService.auditLog.groupBy({
        by: ['actorId'],
        where,
        _count: {
          actorId: true,
        },
        orderBy: {
          _count: {
            actorId: 'desc',
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch user stats: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Delete old audit logs
   * @param olderThan - Date threshold
   * @returns Count of deleted audit logs
   */
  async deleteOldLogs(olderThan: Date) {
    try {
      const result = await this.prismaService.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: olderThan,
          },
        },
      });

      this.logger.log(`Deleted ${result.count} old audit logs`);

      return result;
    } catch (error) {
      this.logger.error(
        `Failed to delete old audit logs: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Helper method to log user actions
   * @param actorId - User ID performing the action
   * @param action - Action being performed
   * @param targetType - Type of target entity
   * @param targetId - ID of target entity
   * @param metadata - Additional metadata
   * @param tx - Optional Prisma transaction client
   */
  async logUserAction(
    actorId: string,
    action: AuditAction,
    targetType: AuditTargetType,
    targetId?: string,
    metadata?: Record<string, any>,
    tx?: TransactionClient
  ) {
    return this.create(
      {
        actorId,
        action,
        targetType,
        targetId,
        metadata,
      },
      tx
    );
  }

  /**
   * Helper method to log system actions (no user actor)
   * @param action - Action being performed
   * @param targetType - Type of target entity
   * @param targetId - ID of target entity
   * @param metadata - Additional metadata
   * @param tx - Optional Prisma transaction client
   */
  async logSystemAction(
    action: AuditAction,
    targetType: AuditTargetType,
    targetId?: string,
    metadata?: Record<string, any>,
    tx?: TransactionClient
  ) {
    return this.create(
      {
        actorId: undefined,
        action,
        targetType,
        targetId,
        metadata,
      },
      tx
    );
  }
}