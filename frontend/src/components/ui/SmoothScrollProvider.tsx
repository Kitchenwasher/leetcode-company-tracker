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
          // Allow native scrolling inside elements with data-lenis-prevent or horizontal scroll tables/code blocks
          return (
            node.hasAttribute('data-lenis-prevent') ||
            node.classList.contains('overflow-x-auto') ||
            node.classList.contains('monaco-editor') ||
            node.closest('.overflow-x-auto') !== null ||
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
