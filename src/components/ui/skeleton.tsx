export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-navy/10 motion-reduce:animate-none ${className}`} />;
}
