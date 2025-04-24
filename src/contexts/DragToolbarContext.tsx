
import { createContext, useContext, useState, ReactNode } from 'react';

interface Position {
  x: number;
  y: number;
}

interface DragToolbarContextType {
  position: Position;
  setPosition: (position: Position) => void;
  isDragging: boolean;
  setIsDragging: (isDragging: boolean) => void;
  dragOffset: Position;
  setDragOffset: (offset: Position) => void;
}

const DragToolbarContext = createContext<DragToolbarContextType | undefined>(undefined);

export function DragToolbarProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  return (
    <DragToolbarContext.Provider value={{
      position,
      setPosition,
      isDragging,
      setIsDragging,
      dragOffset,
      setDragOffset,
    }}>
      {children}
    </DragToolbarContext.Provider>
  );
}

export function useDragToolbar() {
  const context = useContext(DragToolbarContext);
  if (context === undefined) {
    throw new Error('useDragToolbar must be used within a DragToolbarProvider');
  }
  return context;
}
