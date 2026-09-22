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
          if (!node) return false;
          // Prevent Lenis for elements that have data-lenis-prevent,
          // GlideSelect dropdowns, Monaco Editor, dialogs, or internal scroll containers
          return (
            node.hasAttribute('data-lenis-prevent') ||
            node.closest('[data-lenis-prevent]') !== null ||
            node.classList.contains('monaco-editor') ||
            node.closest('.monaco-editor') !== null ||
            node.closest('.glide-select__menu') !== null ||
            node.closest('.glide-select__list') !== null ||
            node.closest('.overflow-y-auto') !== null ||
            node.closest('.overflow-auto') !== null ||
            node.closest('[role="dialog"]') !== null
          );
        },
      }}
    >
      {children}
    </ReactLenis>
  );
};

export default SmoothScrollProvider;
