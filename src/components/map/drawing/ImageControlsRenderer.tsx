
import React from 'react';
import { createRoot } from '@/components/map/drawing/ReactDOMUtils';
import ImageEditControls from '@/components/map/drawing/ImageEditControls';
import { ImageTransformOptions } from '@/utils/image-transform-utils';

/**
 * Renders the image controls for a layer
 */
export const renderImageControls = (
  container: HTMLElement,
  drawingId: string,
  transformOptions: ImageTransformOptions,
  imageControlsRoots: Map<string, any>,
  onTransformChange: (options: Partial<ImageTransformOptions>) => void
): void => {
  // Create React root for image controls
  const controlsRoot = createRoot(container);
  imageControlsRoots.set(`${drawingId}-image-controls`, controlsRoot);
  
  controlsRoot.render(
    <ImageEditControls
      drawingId={drawingId}
      initialTransform={transformOptions}
      onTransformChange={onTransformChange}
    />
  );
};
