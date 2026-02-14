import { AuditAction } from "../enums/audit-action.enum";
import { AuditTargetType } from "../enums/audit-target-type.enum";

/**
 * Interface for creating a new audit log entry.
 */
export interface ICreateAuditLog {
  actorId?: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string;
  metadata?: Record<string, any>;
}