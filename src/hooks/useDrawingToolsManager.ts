
import { useState, useCallback } from 'react';

export function useDrawingToolsManager() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  const handleToolSelect = useCallback((tool: string) => {
    console.log(`Tool selected: ${tool}`);
    setActiveTool(prevTool => tool === prevTool ? null : tool);
  }, []);

  return {
    activeTool,
    setActiveTool,
    handleToolSelect
  };
}
