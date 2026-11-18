import type { NavItem } from "./primary-nav";

export function shellNav(): NavItem[] {
  return [
    { href: "/", label: "Home", icon: "home" },
    { href: "/tasks", label: "Tasks", icon: "tasks" },
    { href: "/people", label: "People", icon: "people" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];
}
