import {
  type SecurityEventPayload,
  type SecurityEventType,
  persistSecurityEvent,
} from "./security-events";

export async function logSecurityEvent(
  type: SecurityEventType,
  payload: SecurityEventPayload,
) {
  console.info(`[security] ${type}`, {
    ...payload,
    userAgent: payload.userAgent || "unknown",
  });

  try {
    await persistSecurityEvent(type, payload);
  } catch (error) {
    console.error(`[security] failed to persist ${type}`, error);
  }
}
