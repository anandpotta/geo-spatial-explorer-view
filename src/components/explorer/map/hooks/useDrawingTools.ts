
import { useState } from 'react';

export function useDrawingTools() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const handleToolSelect = (tool: string) => {
    console.log(`Tool selected: ${tool}`);
    setActiveTool(tool === activeTool ? null : tool);
  };

  return {
    activeTool,
    setActiveTool,
    handleToolSelect
  };
}
