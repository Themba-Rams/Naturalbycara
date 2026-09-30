"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Small IntersectionObserver hook that reports once a ref'd element has
 * scrolled into view, then disconnects (fires once). Used to drive the
 * `.reveal` entrance-animation utility class in globals.css.
 */
export function useInView<T extends Element = HTMLDivElement>(
  threshold = 0.2
) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView } as const;
}
