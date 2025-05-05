
// Extend the global Window interface
declare global {
  interface WindowEventMap {
    'markersUpdated': Event;
    'drawingsUpdated': Event;
    'floorPlanUpdated': CustomEvent<{drawingId: string}>;
    'storage': StorageEvent;
  }
}

export {};
