import type { Messages } from "@/lib/i18n";
import type { NavItem } from "./primary-nav";

export function shellNav(messages: Messages, simplified: boolean): NavItem[] {
  const labels = simplified ? messages.navSimple : messages.nav;
  return [
    { href: "/", label: labels.home, icon: "home" },
    { href: "/tasks", label: labels.tasks, icon: "tasks" },
    { href: "/people", label: labels.people, icon: "people" },
    { href: "/activity", label: labels.activity, icon: "activity" },
    { href: "/settings", label: labels.settings, icon: "settings" },
  ];
}
