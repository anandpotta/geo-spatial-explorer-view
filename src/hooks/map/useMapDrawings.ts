
import { useState, useEffect, useCallback, useRef } from 'react';
import { DrawingData, getSavedDrawings } from '@/utils/drawing-utils';
import { useAuth } from '@/contexts/AuthContext';

export function useMapDrawings() {
  const { currentUser, isAuthenticated } = useAuth();
  const [drawings, setDrawings] = useState<DrawingData[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingData | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  
  const currentUserIdRef = useRef<string | null>(currentUser?.id || null);
  const isAuthenticatedRef = useRef<boolean>(isAuthenticated);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();

  // Update refs when auth state changes
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id || null;
    isAuthenticatedRef.current = isAuthenticated;
  }, [currentUser?.id, isAuthenticated]);

  const loadDrawings = useCallback(() => {
    if (!isAuthenticatedRef.current || !currentUserIdRef.current) {
      setDrawings([]);
      return;
    }
    
    try {
      const savedDrawings = getSavedDrawings();
      setDrawings(savedDrawings);
    } catch (error) {
      console.error('Error loading drawings:', error);
    }
  }, []);

  useEffect(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    
    loadTimeoutRef.current = setTimeout(() => {
      loadDrawings();
    }, 1000);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [isAuthenticated, currentUser?.id, loadDrawings]);

  return {
    drawings,
    setDrawings,
    currentDrawing,
    setCurrentDrawing,
    activeTool,
    setActiveTool
  };
}
