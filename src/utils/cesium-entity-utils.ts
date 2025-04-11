
import * as Cesium from 'cesium';
import { Location } from './geo-utils';

/**
 * Creates a marker entity at the specified location
 */
export function createLocationEntity(
  viewer: Cesium.Viewer,
  location: Location,
  options: {
    color?: Cesium.Color;
    pixelSize?: number;
    outlineWidth?: number;
    outlineColor?: Cesium.Color;
  } = {}
): Cesium.Entity {
  const {
    color = Cesium.Color.RED,
    pixelSize = 15,
    outlineWidth = 3,
    outlineColor = Cesium.Color.WHITE
  } = options;

  const entity = viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(location.x, location.y),
    point: {
      pixelSize,
      color,
      outlineColor,
      outlineWidth
    },
    label: {
      text: location.label.split(',')[0], // First part of the address
      font: '14pt sans-serif',
      style: Cesium.LabelStyle.FILL,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -10)
    }
  });

  return entity;
}

/**
 * Safely removes an entity from the viewer
 */
export function removeEntity(
  viewer: Cesium.Viewer,
  entityRef: React.MutableRefObject<Cesium.Entity | null>
): void {
  if (entityRef.current && viewer.entities.contains(entityRef.current)) {
    viewer.entities.remove(entityRef.current);
    entityRef.current = null;
  }
}

/**
 * Highlights the currently selected entity
 */
export function highlightEntity(
  entity: Cesium.Entity,
  options: {
    activate?: boolean;
    color?: Cesium.Color;
    originalColor?: Cesium.Color;
  } = {}
): void {
  const { 
    activate = true,
    color = Cesium.Color.YELLOW,
    originalColor = Cesium.Color.RED
  } = options;

  if (entity && entity.point) {
    // Cast to any to access private properties
    const point = entity.point as any;
    
    if (point && point.color) {
      point.color = activate ? color : originalColor;
    }
  }
}
