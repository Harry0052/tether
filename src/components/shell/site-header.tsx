import Link from "next/link";
import { PrimaryNav, type NavItem } from "./primary-nav";

export function SiteHeader({
  product,
  control,
  items,
  displayName,
}: {
  product: string;
  control: string;
  items: NavItem[];
  displayName: string | null;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-h-12 items-center gap-2.5 rounded-full" aria-label={`${product} home`}>
          <span className="tether-mark" aria-hidden>
            <span />
            <span />
          </span>
          <span className="font-display text-[1.7rem] leading-none tracking-tight text-navy">{product}</span>
        </Link>
        <div className="flex items-center gap-3">
          {displayName ? (
            <p className="max-w-28 truncate text-sm font-semibold text-navy sm:max-w-40">{displayName}</p>
          ) : null}
          <PrimaryNav items={items} variant="desktop" />
        </div>
      </div>
      <p className="border-t border-mint bg-mint px-4 py-2 text-center text-sm font-semibold text-navy">{control}</p>
    </header>
  );
}
