
import React, { useState } from 'react';
import { toast } from 'sonner';

interface ToolSelectionHandlerProps {
  onToolChange: (tool: string | null) => void;
}

/**
 * Custom hook to manage tool selection state and handlers
 */
export const useToolSelection = ({ onToolChange }: ToolSelectionHandlerProps) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const handleToolSelect = (tool: string) => {
    console.log(`Tool selected: ${tool}`);
    const newToolState = tool === activeTool ? null : tool;
    setActiveTool(newToolState);
    onToolChange(newToolState);
    
    if (tool === 'clear' && newToolState !== null) {
      toast.info('Clearing all shapes');
    }
  };

  return {
    activeTool,
    setActiveTool,
    handleToolSelect
  };
};

// The component just provides the hook implementation
const ToolSelectionHandler: React.FC<ToolSelectionHandlerProps> = (props) => {
  return null; // This is a logic component with no UI
};

export default ToolSelectionHandler;
