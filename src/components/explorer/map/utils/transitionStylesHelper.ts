
import { CSSProperties } from 'react';

interface GetTransitionStylesParams {
  isCurrentView: boolean;
  transitioning: boolean;
}

export function getTransitionStyles({ isCurrentView, transitioning }: GetTransitionStylesParams): React.CSSProperties {
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
    opacity: isCurrentView ? 0.3 : 0.7, // Fading out current view, fading in new view
    transform: isCurrentView ? 'scale(0.95)' : 'scale(0.98)', // Zoom effect
    zIndex: isCurrentView ? 5 : 10, // New view on top during transition
    visibility: 'visible' // Both visible during transition
  };
}

export function getCesiumStyles(currentView: 'cesium' | 'leaflet', transitioning: boolean): React.CSSProperties {
  const isCurrent = currentView === 'cesium';
  const styles = getTransitionStyles({ isCurrentView: isCurrent, transitioning });
  
  return {
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
    transition: 'opacity 600ms ease-in-out, transform 600ms ease-in-out'
  };
}

export function getLeafletStyles(currentView: 'cesium' | 'leaflet', transitioning: boolean): React.CSSProperties {
  const isCurrent = currentView === 'leaflet';
  const styles = getTransitionStyles({ isCurrentView: !isCurrent, transitioning });
  
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    visibility: isCurrent || transitioning ? 'visible' : 'hidden',
    opacity: 1 - (styles.opacity as number),
    transform: isCurrent ? 'scale(1)' : 'scale(0.95)',
    zIndex: isCurrent ? 10 : (transitioning ? 5 : 0),
    transition: 'opacity 600ms ease-in-out, transform 600ms ease-in-out'
  };
}
