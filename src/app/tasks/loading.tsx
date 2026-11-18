import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10" aria-busy="true">
      <p className="sr-only">Loading checklists</p>
      <Skeleton className="h-12 w-48" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-28 w-full" />
    </main>
  );
}
