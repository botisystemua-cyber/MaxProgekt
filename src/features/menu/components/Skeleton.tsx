export function MenuSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-40 bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-6 w-1/3 rounded bg-slate-200" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 shrink-0 rounded-full bg-slate-200" />
          ))}
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-2xl bg-white p-3">
              <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
