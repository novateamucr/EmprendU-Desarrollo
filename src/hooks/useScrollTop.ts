import { useEffect } from 'react';

/**
 * useScrollTop
 * Simple hook to scroll the window to top when a component mounts.
 * Accepts an optional behavior ('auto' | 'smooth'). Default is 'auto'.
 */
export function useScrollTop(behavior: ScrollBehavior = 'auto') {
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior });
    } catch (e) {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
  }, [behavior]);
}

export default useScrollTop;
