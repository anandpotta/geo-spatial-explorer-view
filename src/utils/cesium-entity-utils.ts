
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
): Cesium.Entity | null {
  if (!viewer || !viewer.entities) {
    console.error("Cannot create entity: viewer or viewer.entities is undefined");
    return null;
  }

  const {
    color = Cesium.Color.RED,
    pixelSize = 15,
    outlineWidth = 3,
    outlineColor = Cesium.Color.WHITE
  } = options;

  try {
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
  } catch (e) {
    console.error("Error creating entity:", e);
    return null;
  }
}

/**
 * Safely removes an entity from the viewer
 */
export function removeEntity(
  viewer: Cesium.Viewer,
  entityRef: React.MutableRefObject<Cesium.Entity | null>
): void {
  if (entityRef.current && viewer && viewer.entities && viewer.entities.contains(entityRef.current)) {
    try {
      viewer.entities.remove(entityRef.current);
      entityRef.current = null;
    } catch (e) {
      console.error("Error removing entity:", e);
    }
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
  if (!entity || !entity.point) {
    console.error("Cannot highlight entity: entity or entity.point is undefined");
    return;
  }

  const { 
    activate = true,
    color = Cesium.Color.YELLOW,
    originalColor = Cesium.Color.RED
  } = options;

  try {
    // Cast to any to access private properties
    const point = entity.point as any;
    
    if (point && point.color) {
      point.color = activate ? color : originalColor;
    }
  } catch (e) {
    console.error("Error highlighting entity:", e);
  }
}
