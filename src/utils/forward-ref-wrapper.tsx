
import React, { ForwardedRef } from 'react';

/**
 * A utility function to wrap components that don't accept refs with React.forwardRef
 * This helps resolve the "Function components cannot be given refs" warning
 */
export function forwardRefWrapper<P>(
  Component: React.ComponentType<P>
): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<unknown>> {
  const WrappedComponent = React.forwardRef<unknown, P>(
    (props, ref) => {
      // Pass props but ignore the ref as the component doesn't support it
      return React.createElement(Component, props);
    }
  );
  
  WrappedComponent.displayName = `ForwardRefWrapper(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
}
