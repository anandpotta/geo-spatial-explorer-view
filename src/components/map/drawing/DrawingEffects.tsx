
import { useEffect } from 'react';

interface DrawingEffectsProps {
  activeTool: string | null;
  isInitialized: boolean;
}

const DrawingEffects = ({
  activeTool,
  isInitialized
}: DrawingEffectsProps) => {
  // Apply special effects based on the active tool
  useEffect(() => {
    if (!isInitialized) return;
    
    // Add classes to body to indicate active tool
    if (activeTool) {
      document.body.classList.add(`tool-${activeTool}-active`);
    }
    
    return () => {
      // Clean up tool classes
      if (activeTool) {
        document.body.classList.remove(`tool-${activeTool}-active`);
      }
    };
  }, [activeTool, isInitialized]);
  
  // This is now a pure effect component with no rendering
  return null;
};

export default DrawingEffects;
