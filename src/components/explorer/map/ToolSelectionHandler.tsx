
import React, { useState } from 'react';
import { toast } from 'sonner';

interface ToolSelectionHandlerProps {
  onToolChange: (tool: string | null) => void;
}

const ToolSelectionHandler: React.FC<ToolSelectionHandlerProps> = ({ 
  onToolChange 
}) => {
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

export default ToolSelectionHandler;
