
interface ShapeCreationHandlerProps {
  onCreated: (shape: any) => void;
  onPathsUpdated?: (paths: string[]) => void;
  svgPaths: string[];
}

// Helper function to check if a path already exists in the array
const pathExists = (path: string, paths: string[]): boolean => {
  return paths.includes(path);
};

// More robust debounce helper with cancellation
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return {
    call: (...args: any[]) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        timeoutId = null;
      }, delay);
    },
    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    }
  };
};

// Track the last shape added to prevent duplicates
let lastShapeId: string | null = null;
let lastMarkerPosition: string | null = null;

export function createShapeCreationHandler({ 
  onCreated, 
  onPathsUpdated,
  svgPaths
}: ShapeCreationHandlerProps) {
  // Create a debounced version of the path updater
  const debouncedUpdate = debounce((updatedPaths: string[]) => {
    if (onPathsUpdated) {
      onPathsUpdated(updatedPaths);
    }
  }, 2000); // Increased to 2 second debounce
  
  const handleCreatedWrapper = (shape: any) => {
    // Generate a position identifier for markers
    let positionIdentifier = null;
    if (shape.type === 'marker' && shape.layer && shape.layer.getLatLng) {
      const pos = shape.layer.getLatLng();
      positionIdentifier = `${pos.lat.toFixed(6)},${pos.lng.toFixed(6)}`;
      
      // Skip if this is a duplicate marker at the same position
      if (positionIdentifier === lastMarkerPosition) {
        console.log('Skipping duplicate marker at same position');
        return;
      }
      
      // Update the last marker position
      lastMarkerPosition = positionIdentifier;
    }
    
    // Skip processing if we've already handled this exact shape
    if (shape.id && shape.id === lastShapeId && 
        !(shape.type === 'marker' && positionIdentifier !== null)) {
      return;
    }
    
    // Track this shape ID
    lastShapeId = shape.id || null;
    
    // First call the original handler
    onCreated(shape);
    
    // Then handle SVG path data if present
    if (shape.svgPath) {
      // Only add path to state if it doesn't already exist
      if (!pathExists(shape.svgPath, svgPaths)) {
        const updatedPaths = [...svgPaths, shape.svgPath];
        // Use the debounced update
        debouncedUpdate.call(updatedPaths);
      }
    }
  };

  return handleCreatedWrapper;
}
