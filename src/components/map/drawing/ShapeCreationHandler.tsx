
interface ShapeCreationHandlerProps {
  onCreated: (shape: any) => void;
  onPathsUpdated?: (paths: string[]) => void;
  svgPaths: string[];
}

export function createShapeCreationHandler({ 
  onCreated, 
  onPathsUpdated,
  svgPaths
}: ShapeCreationHandlerProps) {
  const handleCreatedWrapper = (shape: any) => {
    // Process the shape and check for SVG path data
    if (shape.svgPath) {
      // Add path to state
      const updatedPaths = [...svgPaths, shape.svgPath];
      if (onPathsUpdated) {
        onPathsUpdated(updatedPaths);
      }
    }
    onCreated(shape);
  };

  return handleCreatedWrapper;
}
