
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
      // Skip path updates during edit mode activation
      if (activeTool === 'edit') {
        console.log('Shape created during edit mode, SVG path updates temporarily suppressed');
      } else {
        // Only add path to state if not in edit mode
        const updatedPaths = [...svgPaths, shape.svgPath];
        if (onPathsUpdated) {
          onPathsUpdated(updatedPaths);
        }
      }
    }
    onCreated(shape);
  };

  return handleCreatedWrapper;
}
