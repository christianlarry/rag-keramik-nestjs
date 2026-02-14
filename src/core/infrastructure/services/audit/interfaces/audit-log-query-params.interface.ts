import { AuditAction } from "../enums/audit-action.enum";
import { AuditTargetType } from "../enums/audit-target-type.enum";

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