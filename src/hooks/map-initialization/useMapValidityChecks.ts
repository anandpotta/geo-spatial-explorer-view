
import { useRef } from 'react';
import L from 'leaflet';
import { isMapValid } from '@/utils/leaflet-type-utils';

/**
 * Hook for map validity checks and recovery attempts
 */
export function useMapValidityChecks() {
  const validityChecksRef = useRef(0);
  const recoveryAttemptRef = useRef(0);
  const validityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset the validity check counters
  const resetValidityChecks = () => {
    validityChecksRef.current = 0;
    recoveryAttemptRef.current = 0;
  };
  
  // Clean up validity check interval
  const cleanupValidityChecks = () => {
    if (validityCheckIntervalRef.current) {
      clearInterval(validityCheckIntervalRef.current);
      validityCheckIntervalRef.current = null;
    }
  };
  
  return {
    validityChecksRef,
    recoveryAttemptRef,
    validityCheckIntervalRef,
    resetValidityChecks,
    cleanupValidityChecks
  };
}
