/**
 * Feature flags.
 * These are runtime toggles that can be changed without redeploying the server code.
 * In production, these should be loaded from a database or config service.
 */
export const featureFlags = {
  ENABLE_RANKED: false,
  ENABLE_VOICE: false,
  ENABLE_ADVANCED_ROLES: false,
  ENABLE_COSMETICS: false,
  ENABLE_PRACTICE_MODE: true,
  ENABLE_SPECTATOR: true,
  ENABLE_AI_FILL: false,
  ENABLE_DETAILED_LOGS: true,
  ENABLE_ADULT_MODE: true,
  DISABLE_REGISTRATION: false,
  MAINTENANCE_MODE: false,
} as const;
