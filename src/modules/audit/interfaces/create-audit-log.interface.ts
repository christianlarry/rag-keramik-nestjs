import { AuditAction, AuditTargetType } from "src/generated/prisma/enums";

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