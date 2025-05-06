
import React, { useEffect } from 'react';
import DrawingEffects from './DrawingEffects';

interface DrawingControlsEffectsProps {
  activeTool: string | null;
  isInitialized: boolean;
}

const DrawingControlsEffects: React.FC<DrawingControlsEffectsProps> = ({ 
  activeTool, 
  isInitialized 
}) => {
  return (
    <DrawingEffects 
      activeTool={activeTool} 
      isInitialized={isInitialized}
    />
  );
};

export default DrawingControlsEffects;
