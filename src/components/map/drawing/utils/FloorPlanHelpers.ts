
import { getDrawingIdsWithFloorPlans } from '@/utils/floor-plan-utils';

/**
 * Check if a drawing has an associated floor plan
 */
export const hasFloorPlan = async (drawingId: string): Promise<boolean> => {
  const drawingsWithFloorPlans = await getDrawingIdsWithFloorPlans();
  return drawingsWithFloorPlans.includes(drawingId);
};
