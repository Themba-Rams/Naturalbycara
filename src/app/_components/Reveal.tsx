"use client";

import type { ReactNode } from "react";
import { useInView } from "./useInView";

/**
 * Wraps children in a div that fades/rises into view once, using
 * IntersectionObserver via useInView. `delay` (ms) can be used to stagger
 * siblings by 80-120ms increments.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section";
}) {
  const { ref, isInView } = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${isInView ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: isInView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}
