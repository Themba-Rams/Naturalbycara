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
    <nav className="flex flex-wrap gap-1 border-b border-zinc-200 bg-white px-4 sm:px-6">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
