import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { SiteFooter } from "@/components/shell/site-footer";
import { SiteHeader } from "@/components/shell/site-header";
import { PrimaryNav } from "@/components/shell/primary-nav";
import { readSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { getMessages } from "@/lib/i18n";
import "./globals.css";

const source = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: {
    default: "Tether",
    template: "%s · Tether",
  },
  description: "Help someone online without taking over their identity. You approve every important step.",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = getMessages();
  const user = await readSessionUser(getDb());
  const named = user && user.displayName !== "Guest" ? user.displayName : null;
  const items = [
    { href: "/", label: messages.nav.home, icon: "home" as const },
    { href: "/settings", label: messages.nav.settings, icon: "settings" as const },
  ];

  return (
    <html
      lang="en"
      data-scale={user?.textScale ?? "1"}
      data-contrast={user?.contrast ?? "standard"}
      data-simplified={user?.simplified ? "true" : "false"}
      className={`${source.variable} ${fraunces.variable} h-full`}
    >
      <body className="flex min-h-full flex-col pb-24 font-sans text-navy antialiased md:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-ivory"
        >
          {messages.skip}
        </a>
        <SiteHeader product={messages.product} control={messages.control} items={items} displayName={named} />
        <div className="flex-1">{children}</div>
        <SiteFooter line={messages.footer.line} />
        <PrimaryNav items={items} variant="mobile" />
      </body>
    </html>
  );
}
