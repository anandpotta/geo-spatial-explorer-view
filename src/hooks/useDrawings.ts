
import { useState, useEffect, useRef, useCallback } from 'react';
import { DrawingData, getSavedDrawings, deleteDrawing } from '@/utils/drawing-utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useDrawings() {
  const [savedDrawings, setSavedDrawings] = useState<DrawingData[]>([]);
  const { currentUser } = useAuth();
  const isLoadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const mountedRef = useRef(true);
  
  const loadDrawings = useCallback(() => {
    if (!mountedRef.current || isLoadingRef.current) return;
    
    // Throttle loading to prevent excessive calls
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 1000) return;
    
    isLoadingRef.current = true;
    lastLoadTimeRef.current = now;
    
    try {
      if (!currentUser) {
        setSavedDrawings([]);
        return;
      }
      
      const drawings = getSavedDrawings();
      setSavedDrawings(prevDrawings => {
        // Only update if drawings actually changed
        if (JSON.stringify(prevDrawings) === JSON.stringify(drawings)) {
          return prevDrawings;
        }
        return drawings;
      });
      
      console.log(`Loaded ${drawings.length} drawings for user ${currentUser.id}`);
    } catch (error) {
      console.error('Error loading drawings:', error);
    } finally {
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 500);
    }
  }, [currentUser]);
  
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial load
    loadDrawings();
    
    // Debounced event handlers to prevent rapid firing
    let storageTimeout: NodeJS.Timeout;
    let drawingsTimeout: NodeJS.Timeout;
    let userTimeout: NodeJS.Timeout;
    let floorPlanTimeout: NodeJS.Timeout;
    
    const handleStorage = () => {
      if (storageTimeout) clearTimeout(storageTimeout);
      storageTimeout = setTimeout(() => {
        if (mountedRef.current) loadDrawings();
      }, 1000);
    };
    
    const handleDrawingsUpdated = () => {
      if (drawingsTimeout) clearTimeout(drawingsTimeout);
      drawingsTimeout = setTimeout(() => {
        if (mountedRef.current) loadDrawings();
      }, 500);
    };
    
    const handleUserChanged = () => {
      if (userTimeout) clearTimeout(userTimeout);
      userTimeout = setTimeout(() => {
        if (mountedRef.current) loadDrawings();
      }, 100);
    };
    
    const handleFloorPlanUpdated = () => {
      if (floorPlanTimeout) clearTimeout(floorPlanTimeout);
      floorPlanTimeout = setTimeout(() => {
        if (mountedRef.current) loadDrawings();
      }, 500);
    };
    
    // Add event listeners
    window.addEventListener('storage', handleStorage);
    window.addEventListener('drawingsUpdated', handleDrawingsUpdated);
    window.addEventListener('userChanged', handleUserChanged);
    window.addEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    
    return () => {
      mountedRef.current = false;
      
      // Clear all timeouts
      if (storageTimeout) clearTimeout(storageTimeout);
      if (drawingsTimeout) clearTimeout(drawingsTimeout);
      if (userTimeout) clearTimeout(userTimeout);
      if (floorPlanTimeout) clearTimeout(floorPlanTimeout);
      
      // Remove event listeners
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('drawingsUpdated', handleDrawingsUpdated);
      window.removeEventListener('userChanged', handleUserChanged);
      window.removeEventListener('floorPlanUpdated', handleFloorPlanUpdated);
    };
  }, [loadDrawings]);
  
  const handleDeleteDrawing = useCallback((id: string) => {
    if (!currentUser) {
      toast.error('Please log in to manage drawings');
      return;
    }
    
    deleteDrawing(id);
    loadDrawings(); // Reload immediately after delete
    toast.success('Drawing deleted');
  }, [currentUser, loadDrawings]);
  
  return { 
    savedDrawings, 
    setSavedDrawings, 
    deleteDrawing: handleDeleteDrawing 
  };
}
