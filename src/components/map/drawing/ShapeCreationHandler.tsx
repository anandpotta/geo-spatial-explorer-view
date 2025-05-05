
interface ShapeCreationHandlerProps {
  onCreated: (shape: any) => void;
  onPathsUpdated?: (paths: string[]) => void;
  svgPaths: string[];
  activeTool?: string | null;
}

export function createShapeCreationHandler({ 
  onCreated, 
  onPathsUpdated,
  svgPaths,
  activeTool
}: ShapeCreationHandlerProps) {
  const handleCreatedWrapper = (shape: any) => {
    // Process the shape and check for SVG path data
    if (shape.svgPath) {
      // Always add path to state regardless of edit mode
      const updatedPaths = [...svgPaths, shape.svgPath];
      if (onPathsUpdated) {
        console.log("Updating paths on shape creation:", updatedPaths);
        onPathsUpdated(updatedPaths);
      }
    }
    onCreated(shape);
  };

  return handleCreatedWrapper;
}
