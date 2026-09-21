import React, { PropsWithChildren } from 'react';
import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';

interface SmoothScrollProviderProps extends PropsWithChildren {
  lerp?: number;
  duration?: number;
}

export const SmoothScrollProvider: React.FC<SmoothScrollProviderProps> = ({
  children,
  lerp = 0.1,
  duration = 1.2,
}) => {
  return (
    <ReactLenis
      root
      options={{
        lerp,
        duration,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.5,
        prevent: (node) => {
          // Only prevent Lenis for elements that explicitly have data-lenis-prevent,
          // or Monaco Editor which has its own independent virtualized scroll system.
          return (
            node.hasAttribute('data-lenis-prevent') ||
            node.closest('[data-lenis-prevent]') !== null ||
            node.classList.contains('monaco-editor') ||
            node.closest('.monaco-editor') !== null
          );
        },
      }}
    >
      {children}
    </ReactLenis>
  );
};

export default SmoothScrollProvider;
