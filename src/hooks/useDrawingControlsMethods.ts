
import { useImperativeHandle, ForwardedRef } from 'react';
import { DrawingControlsRef } from '@/hooks/useDrawingControls';

interface DrawingControlsMethodsProps {
  featureGroupRef: React.RefObject<L.FeatureGroup>;
  drawToolsRef: React.RefObject<any>;
  openFileUploadDialog: (drawingId: string) => void;
  getSvgPaths: () => string[];
}

export function useDrawingControlsMethods(
  ref: ForwardedRef<DrawingControlsRef>,
  { featureGroupRef, drawToolsRef, openFileUploadDialog, getSvgPaths }: DrawingControlsMethodsProps
) {
  useImperativeHandle(ref, () => ({
    getFeatureGroup: () => featureGroupRef.current,
    getDrawTools: () => drawToolsRef.current,
    openFileUploadDialog,
    getSvgPaths: () => {
      if (drawToolsRef.current) {
        return drawToolsRef.current.getSVGPathData();
      }
      return [];
    },
    restorePathVisibility: () => {
      if (drawToolsRef.current && drawToolsRef.current.getPathElements) {
        const paths = drawToolsRef.current.getPathElements();
        paths.forEach((path: SVGPathElement) => {
          if (!path.classList.contains('visible-path-stroke')) {
            path.classList.add('visible-path-stroke');
          }
        });
      }
    }
  }));
}
