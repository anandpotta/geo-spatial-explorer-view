
import React from 'react';

/**
 * A utility function to wrap components that don't accept refs with React.forwardRef
 * This helps resolve the "Function components cannot be given refs" warning
 */
export function forwardRefWrapper<P>(
  Component: React.ComponentType<P>
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<unknown>> {
  return React.forwardRef((props: P, ref) => {
    // Pass props but ignore the ref as the component doesn't support it
    return React.createElement(Component, props);
  });
}
