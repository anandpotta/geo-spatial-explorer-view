
/**
 * Common types for visibility utilities
 */

declare global {
  interface Window {
    _controlsVisibilityTimeout?: number;
    _editModeActivating?: boolean;
    _editControlsForceVisible?: boolean;
  }
}
