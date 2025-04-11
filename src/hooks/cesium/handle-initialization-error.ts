
import { toast } from '@/components/ui/use-toast';
import { ViewerInitializationOptions } from './initialization-types';

/**
 * Handles errors during Cesium viewer initialization
 */
export function handleInitializationError(
  error: unknown, 
  options: ViewerInitializationOptions
): void {
  const {
    initializationAttempts,
    initTimeoutRef,
    setIsLoadingMap,
    setMapError,
  } = options;
  
  console.error('Error initializing Cesium viewer:', error);
  initializationAttempts.current += 1;
  
  if (initializationAttempts.current >= 3) {
    setMapError('Failed to initialize 3D globe. Please try again later.');
    setIsLoadingMap(false);
    
    toast({
      title: "Map Error",
      description: "Failed to initialize 3D globe. Falling back to 2D view.",
      variant: "destructive"
    });
  } else {
    // Try again with a slight delay
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    
    initTimeoutRef.current = setTimeout(() => {
      setIsLoadingMap(true);
      // Re-import and call the initializeViewer function to avoid circular dependencies
      import('./viewer-initialization').then(module => {
        module.initializeViewer(options);
      });
    }, 1000);
  }
}
