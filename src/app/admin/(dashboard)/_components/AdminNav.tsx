"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/availability", label: "Weekly Availability" },
  { href: "/admin/date-overrides", label: "Date Overrides" },
  { href: "/admin/services", label: "Services" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin sections"
      className="glass-card scrollbar-none m-3 flex gap-1 overflow-x-auto p-2 sm:mx-6 md:sticky md:top-4 md:m-4 md:mr-0 md:h-fit md:w-56 md:flex-col md:overflow-visible md:p-3"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors md:rounded-lg md:px-4 md:py-2.5 ${
              isActive
                ? "bg-accent text-accent-contrast-text"
                : "text-text-secondary hover:bg-bg-surface-alt hover:text-text-primary"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <div aria-hidden className="w-2 shrink-0 md:hidden" />
    </nav>
  );
}
