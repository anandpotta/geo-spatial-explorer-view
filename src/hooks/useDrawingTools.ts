
import { useState } from 'react';

export function useDrawingTools() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const handleToolSelect = (tool: string) => {
    setActiveTool(prev => (prev === tool ? null : tool));
  };

  return {
    activeTool,
    setActiveTool,
    handleToolSelect,
  };
}
