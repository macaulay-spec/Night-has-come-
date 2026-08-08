// ─── UI Components ──────────────────────────────────────────────────
// Components will be implemented in Phase 9 (UI).
// For now, export the component names and placeholder types.

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ComponentVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';

// Placeholder component identifiers
export const COMPONENTS = [
  'Button',
  'Card',
  'Input',
  'Modal',
  'Timer',
  'PlayerCard',
  'PhaseIndicator',
  'RoleCard',
  'VotePanel',
  'ChatPanel',
  'ActionBar',
  'Avatar',
  'Badge',
  'Toast',
  'Tooltip',
  'ProgressBar',
  'LoadingSpinner',
  'EmptyState',
  'ErrorState',
  'TabBar',
  'BottomSheet',
  'Drawer',
  'PlayerGrid',
  'EvidenceRail',
] as const;
