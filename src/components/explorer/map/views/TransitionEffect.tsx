
import React from 'react';

interface TransitionEffectProps {
  transitioning: boolean;
}

const TransitionEffect: React.FC<TransitionEffectProps> = ({ transitioning }) => {
  if (!transitioning) return null;
  
  return (
    <div 
      className="absolute inset-0 bg-black bg-opacity-20 z-20 pointer-events-none"
      style={{
        animation: 'fadeInOut 400ms ease-in-out forwards'
      }}
    />
  );
};

export default TransitionEffect;
