/**
 * A small, hand-drawn line-art botanical divider used as a subtle brand
 * accent. Monochrome/sage-tinted by default via `currentColor`.
 */
export default function LeafDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12 H80" />
      <path d="M120 12 H198" />
      <path d="M100 4 C94 8 92 16 100 20 C108 16 106 8 100 4 Z" />
      <path d="M84 12 C88 6 94 5 98 8" />
      <path d="M84 12 C88 18 94 19 98 16" />
      <path d="M116 12 C112 6 106 5 102 8" />
      <path d="M116 12 C112 18 106 19 102 16" />
    </svg>
  );
}
