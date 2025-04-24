
import { useEffect, useRef } from 'react';
import L from 'leaflet';

export function useMarkerEvents(map: L.Map | null) {
  const mapRef = useRef<L.Map | null>(map);
  
  // Keep the ref updated when the map changes
  useEffect(() => {
    mapRef.current = map;
  }, [map]);
  
  useEffect(() => {
    // Track active input elements
    let activeInput: HTMLElement | null = null;
    
    // Function to check if target is within marker form
    const isMarkerFormElement = (target: HTMLElement): boolean => {
      return !!(
        target.closest('.marker-form-popup') || 
        target.closest('#marker-form') || 
        target.id === 'marker-name' ||
        target.classList.contains('marker-form-popup') ||
        target.classList.contains('popup-container')
      );
    };
    
    // Track focus changes to identify active inputs
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if ((target.tagName === 'INPUT' || target.tagName === 'BUTTON') && isMarkerFormElement(target)) {
        activeInput = target;
        window.tempMarkerPlaced = true;
        window.userHasInteracted = true;
      }
    };
    
    const handleFocusOut = () => {
      // Small delay to ensure we don't lose focus during normal typing
      setTimeout(() => {
        activeInput = null;
      }, 100);
    };
    
    // Disable map keyboard events while marker form is active
    const preventMapKeyboardEvents = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      
      // Always allow events for form inputs
      if (isMarkerFormElement(target) || activeInput === target) {
        e.stopPropagation();
        // Don't prevent default as that would stop typing
        
        // Update global flags
        window.tempMarkerPlaced = true;
        window.userHasInteracted = true;
        return;
      }
      
      // Check for active popup
      const popup = document.querySelector('.marker-form-popup');
      if (popup) {
        // If we have an active popup but the event isn't for an input,
        // prevent map interactions
        e.stopPropagation();
        e.preventDefault();
      }
    };
    
    // Capture click events on popup to make sure they aren't propagated to map
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      if (isMarkerFormElement(target)) {
        e.stopPropagation();
        window.tempMarkerPlaced = true;
        window.userHasInteracted = true;
      }
    };
    
    // Add keyboard event listeners with capture phase
    document.addEventListener('keypress', preventMapKeyboardEvents, true);
    document.addEventListener('keydown', preventMapKeyboardEvents, true);
    document.addEventListener('keyup', preventMapKeyboardEvents, true);
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);
    document.addEventListener('click', handleDocumentClick, true);
    document.addEventListener('touchstart', handleDocumentClick, true);
    
    // Cleanup event listeners
    return () => {
      document.removeEventListener('keypress', preventMapKeyboardEvents, true);
      document.removeEventListener('keydown', preventMapKeyboardEvents, true);
      document.removeEventListener('keyup', preventMapKeyboardEvents, true);
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('touchstart', handleDocumentClick, true);
    };
  }, []);
}
