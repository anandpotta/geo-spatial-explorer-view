
/**
 * Type definitions for clip mask operations
 */
import L from 'leaflet';

export interface ApplyClipMaskOptions {
  drawingId: string;
  layer: L.Layer;
  imageUrl?: string; // Optional imageUrl
  retryOnFailure?: boolean;
  isMounted?: boolean;
}

export interface ApplyWithStabilityOptions extends ApplyClipMaskOptions {
  stabilityWaitTime?: number;
  maxRetries?: number;
}
