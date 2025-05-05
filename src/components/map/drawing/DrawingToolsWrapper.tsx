
import React from 'react';
import DrawTools from '../DrawTools';
import { createShapeCreationHandler } from './ShapeCreationHandler';
import { handleClearAll } from './ClearAllHandler';

interface DrawingToolsWrapperProps {
  drawToolsRef: React.RefObject<any>;
  featureGroup: L.FeatureGroup;
  activeTool: string | null;
  onCreated: (shape: any) => void;
  onClearAll?: () => void;
  onPathsUpdated?: (paths: string[]) => void;
  svgPaths: string[];
}

const DrawingToolsWrapper = ({
  drawToolsRef,
  featureGroup,
  activeTool,
  onCreated,
  onClearAll,
  onPathsUpdated,
  svgPaths
}: DrawingToolsWrapperProps) => {
  const handleCreatedWrapper = createShapeCreationHandler({
    onCreated,
    onPathsUpdated,
    svgPaths
  });

  const handleClearAllWrapper = () => {
    handleClearAll({
      featureGroup,
      onClearAll
    });
  };

  return (
    <DrawTools
      ref={drawToolsRef}
      onCreated={handleCreatedWrapper}
      activeTool={activeTool}
      onClearAll={handleClearAllWrapper}
      featureGroup={featureGroup}
    />
  );
};

export default DrawingToolsWrapper;
