
import { useRef } from 'react';
import { createShapeCreationHandler } from '@/components/map/drawing/ShapeCreationHandler';
import L from 'leaflet';

export const useShapeCreation = (onCreated: (shape: any) => void) => {
  // Track whether a marker is currently being processed
  const isProcessingMarkerRef = useRef(false);
  const lastProcessedMarkerRef = useRef<string | null>(null);

  // Create a wrapper for shape creation that prevents duplicates
  const handleCreated = (shape: any) => {
    // Generate an ID for this shape if it doesn't have one
    if (!shape.id) {
      shape.id = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Special handling for markers to prevent duplicates
    if (shape.type === 'marker' || (shape.layer && shape.layer instanceof L.Marker)) {
      // If we're already processing a marker or this is a duplicate, skip
      if (isProcessingMarkerRef.current || 
          (lastProcessedMarkerRef.current && lastProcessedMarkerRef.current === shape.id)) {
        console.log('Skipping duplicate marker creation', shape);
        return;
      }

      // Set the processing flag
      isProcessingMarkerRef.current = true;
      lastProcessedMarkerRef.current = shape.id;

      // Clear the processing flag after a short delay
      setTimeout(() => {
        isProcessingMarkerRef.current = false;
      }, 500);
    }

    // Use the shape creation handler
    const handler = createShapeCreationHandler({
      onCreated,
      onPathsUpdated: () => {},
      svgPaths: []
    });

    handler(shape);
  };

  return { handleCreated };
};
