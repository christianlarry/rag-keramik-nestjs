import { AuditAction, AuditTargetType } from "src/generated/prisma/enums";

/**
 * Interface for querying audit logs with various parameters.
 */
export interface IAuditLogQueryParams {
  actorId?: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}