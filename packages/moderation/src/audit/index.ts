/**
 * Audit logging for moderation actions.
 * Every moderation action must be recorded with full details.
 */

export interface AuditEntry {
  userId: string | null;
  moderatorId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null;
  timestamp: string;
}

export interface AuditLog {
  entries: AuditEntry[];
}

/**
 * Create an audit log entry for a moderation action.
 */
export function createAuditEntry(params: {
  userId?: string | null;
  moderatorId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}): AuditEntry {
  return {
    userId: params.userId ?? null,
    moderatorId: params.moderatorId ?? null,
    action: params.action,
    resource: params.resource,
    resourceId: params.resourceId ?? null,
    details: params.details ?? {},
    ipAddress: params.ipAddress ?? null,
    timestamp: new Date().toISOString(),
  };
}
