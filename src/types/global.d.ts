
// Global type definitions

export {}; // This is needed for TypeScript to treat this as a module

declare global {
  interface Window {
    tempMarkerPositionUpdate?: (pos: [number, number]) => void;
  }
}
