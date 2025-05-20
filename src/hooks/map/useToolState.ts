
import { useState } from 'react';

export function useToolState() {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  return {
    activeTool,
    setActiveTool
  };
}
