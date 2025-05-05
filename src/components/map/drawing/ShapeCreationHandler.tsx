
interface ShapeCreationHandlerProps {
  onCreated: (shape: any) => void;
  onPathsUpdated?: (paths: string[]) => void;
  svgPaths: string[];
}

// Helper function to check if a path already exists in the array
const pathExists = (path: string, paths: string[]): boolean => {
  return paths.includes(path);
};

// Debounce helper to prevent too frequent updates
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export function createShapeCreationHandler({ 
  onCreated, 
  onPathsUpdated,
  svgPaths
}: ShapeCreationHandlerProps) {
  // Create a debounced version of the path updater
  const debouncedPathUpdate = debounce((updatedPaths: string[]) => {
    if (onPathsUpdated) {
      onPathsUpdated(updatedPaths);
    }
  }, 1000); // 1 second debounce
  
  const handleCreatedWrapper = (shape: any) => {
    // Process the shape and check for SVG path data
    if (shape.svgPath) {
      // Only add path to state if it doesn't already exist
      if (!pathExists(shape.svgPath, svgPaths)) {
        const updatedPaths = [...svgPaths, shape.svgPath];
        debouncedPathUpdate(updatedPaths);
      }
    }
    onCreated(shape);
  };

  return handleCreatedWrapper;
}
