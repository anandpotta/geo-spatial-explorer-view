
import { CSSProperties } from 'react';

/**
 * Utility functions for generating transition styles for map views
 */
export const getTransitionStyles = (isCurrentView: boolean, transitioning: boolean): React.CSSProperties => {
  if (!transitioning) {
    return {
      opacity: isCurrentView ? 1 : 0,
      transform: isCurrentView ? 'scale(1)' : 'scale(0.95)',
      zIndex: isCurrentView ? 10 : 0,
      visibility: isCurrentView ? 'visible' : 'hidden'
    };
  }
  
  // During transition, both views are visible but with different opacities
  return {
    opacity: isCurrentView ? 0.2 : 0.8, // Faster fade out for current view
    transform: isCurrentView ? 'scale(0.97)' : 'scale(1)', // More pronounced zoom effect
    zIndex: isCurrentView ? 5 : 10, // New view on top during transition
    visibility: 'visible' // Both visible during transition
  };
};

/**
 * Generate styles for Cesium view
 */
export const getCesiumStyles = (currentView: 'cesium' | 'leaflet', transitioning: boolean): React.CSSProperties => {
  const isCurrent = currentView === 'cesium';
  const styles = getTransitionStyles(isCurrent, transitioning);
  
  const baseStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    visibility: styles.visibility,
    opacity: styles.opacity,
    transform: styles.transform,
    zIndex: styles.zIndex,
    transition: 'opacity 600ms ease-in-out, transform 600ms ease-in-out' // Slower, smoother transition
  };
  
  return baseStyles;
};

/**
 * Generate styles for Leaflet view
 */
export const getLeafletStyles = (
  currentView: 'cesium' | 'leaflet', 
  transitioning: boolean,
  preloadedLeaflet: boolean
): React.CSSProperties => {
  const isCurrent = currentView === 'leaflet';
  const styles = getTransitionStyles(!isCurrent, transitioning);
  
  // For leaflet, we want to keep it preloaded in the background but invisible
  const baseStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    // Show when current view or during transition or when preloaded
    visibility: isCurrent || transitioning || preloadedLeaflet ? 'visible' : 'hidden',
    opacity: isCurrent ? 1 : (transitioning ? 0.8 : 0),
    transform: isCurrent ? 'scale(1)' : 'scale(0.98)',
    zIndex: isCurrent ? 10 : (transitioning ? 5 : 1),
    transition: 'opacity 600ms ease-in-out, transform 600ms ease-in-out' // Slower, smoother transition
  };
  
  return baseStyles;
};
