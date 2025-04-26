
// Extend the Window interface to include custom properties
interface Window {
  tempMarkerPositionUpdate?: (pos: [number, number]) => void;
  markerUpdateDebounceTimer: number | null;
}
