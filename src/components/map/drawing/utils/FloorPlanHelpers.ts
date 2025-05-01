
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';

/**
 * Check if a drawing has an associated floor plan
 */
export const hasFloorPlan = (drawingId: string): boolean => {
  const drawingsWithFloorPlans = getDrawingIdsWithFloorPlans();
  return drawingsWithFloorPlans.includes(drawingId);
};
