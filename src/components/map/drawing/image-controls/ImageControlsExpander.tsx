
import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

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
        className="flex items-center justify-center w-full text-xs text-blue-600 hover:text-blue-800 font-semibold bg-gray-100 py-1 px-2 rounded"
      >
        {expanded ? (
          <>
            <span>Hide Options</span>
            <ChevronUp size={14} className="ml-1" />
          </>
        ) : (
          <>
            <span>Show All Options</span>
            <ChevronDown size={14} className="ml-1" />
          </>
        )}
      </button>
    </div>
  );
};

export default ImageControlsExpander;
