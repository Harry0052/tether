import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { getMessages } from "@/lib/i18n";

export default function NotFound() {
  const copy = getMessages().notFound;
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col px-4 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">{copy.code}</p>
      <h1 className="mt-3 font-display text-5xl tracking-tight">{copy.title}</h1>
      <p className="mt-4 max-w-xl text-lg leading-8 text-muted">{copy.body}</p>
      <Link href="/" className={`${buttonClass("primary")} mt-8 w-fit`}>
        {copy.home}
      </Link>
    </main>
  );
}
