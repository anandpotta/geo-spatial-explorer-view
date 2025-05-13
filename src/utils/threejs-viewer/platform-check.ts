
/**
 * Utility to check the current platform
 */

export const isReactNative = (): boolean => {
  return typeof navigator !== 'undefined' && navigator.product === 'ReactNative';
};

export const isWeb = (): boolean => {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.product !== 'ReactNative';
};
