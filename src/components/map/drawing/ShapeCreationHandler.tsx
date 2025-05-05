
interface ShapeCreationHandlerProps {
  onCreated: (shape: any) => void;
  onPathsUpdated?: (paths: string[]) => void;
  svgPaths: string[];
}

// Helper function to check if a path already exists in the array
const pathExists = (path: string, paths: string[]): boolean => {
  return paths.includes(path);
};

export function createShapeCreationHandler({ 
  onCreated, 
  onPathsUpdated,
  svgPaths
}: ShapeCreationHandlerProps) {
  const handleCreatedWrapper = (shape: any) => {
    // Process the shape and check for SVG path data
    if (shape.svgPath) {
      // Only add path to state if it doesn't already exist
      if (!pathExists(shape.svgPath, svgPaths)) {
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
