export function SiteFooter({ line }: { line: string }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm leading-6 text-muted">
        <p>{line}</p>
        <p>Times on later screens are labeled UTC. This copy is not a compliance claim.</p>
      </div>
    </footer>
  );
}
