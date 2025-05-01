
import React from 'react';

interface ImageControlsExpanderProps {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

/**
 * Button to expand/collapse the image controls
 */
const ImageControlsExpander = ({ expanded, setExpanded }: ImageControlsExpanderProps) => {
  return (
    <div className="text-center mb-1">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
      >
        {expanded ? 'Hide Options' : 'Show All Options'}
      </button>
    </div>
  );
};

export default ImageControlsExpander;
