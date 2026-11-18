"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Settings, Users, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: "home" | "settings" | "tasks" | "people" };

const icons: Record<NavItem["icon"], LucideIcon> = {
  home: Home,
  settings: Settings,
  tasks: ListChecks,
  people: Users,
};

export function PrimaryNav({ items, variant }: { items: NavItem[]; variant: "desktop" | "mobile" }) {
  const pathname = usePathname();
  if (variant === "desktop") {
    return (
      <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-12 items-center rounded-full px-4 text-base font-semibold ${
                active ? "bg-mint text-navy" : "text-navy hover:bg-navy/5"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  const columns = items.length === 4 ? "grid-cols-4" : items.length === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 backdrop-blur md:hidden"
    >
      <ul className={`grid ${columns}`}>
        {items.map((item) => {
          const Icon = icons[item.icon];
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-sm font-semibold ${
                  active ? "text-navy" : "text-muted"
                }`}
              >
                <Icon aria-hidden className="size-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
