
import { useEditMode as importedUseEditMode } from '../components/map/draw-tools/hooks/useEditMode';

export function useEditMode(editControlRef: React.RefObject<any>, activeTool: string | null) {
  return importedUseEditMode(editControlRef, activeTool);
}
