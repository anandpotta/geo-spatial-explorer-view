
import React from 'react';
import { createShapeCreationHandler } from './ShapeCreationHandler';

interface ShapeCreationWrapperProps {
  onCreated: (shape: any) => void;
  onPathsUpdated?: (paths: string[]) => void;
  svgPaths: string[];
}

const ShapeCreationWrapper: React.FC<ShapeCreationWrapperProps> = ({
  onCreated,
  onPathsUpdated,
  svgPaths
}) => {
  const handleCreatedWrapper = createShapeCreationHandler({
    onCreated,
    onPathsUpdated,
    svgPaths
  });

  return null; // This is a logic wrapper, not a visual component
};

export default ShapeCreationWrapper;
