
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ImageControlsExpanderProps {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}

/**
 * Component to expand/collapse image controls
 */
const ImageControlsExpander: React.FC<ImageControlsExpanderProps> = ({ expanded, setExpanded }) => {
  return (
    <button 
      className="flex items-center justify-center w-full p-1 mb-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
      onClick={() => setExpanded(!expanded)}
      style={{
        visibility: 'visible', 
        opacity: 1, 
        pointerEvents: 'auto'
      }}
      aria-label={expanded ? "Collapse Controls" : "Expand Controls"}
    >
      {expanded ? (
        <>
          <ChevronUp size={14} className="mr-1" />
          <span>Less Controls</span>
        </>
      ) : (
        <>
          <ChevronDown size={14} className="mr-1" />
          <span>More Controls</span>
        </>
      )}
    </button>
  );
};

export default ImageControlsExpander;
