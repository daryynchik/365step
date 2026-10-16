export default function Loading() {
  return (
    <div className="grid animate-pulse gap-8 lg:grid-cols-[minmax(0,1fr)_340px]" aria-busy="true" aria-label="Загрузка">
      <div className="space-y-4">
        <div className="h-8 w-56 rounded-lg bg-sunken" />
        <div className="h-28 rounded-xl bg-sunken" />
        <div className="mx-auto flex max-w-md flex-col items-center gap-8 pt-6">
          {[0, 46, 70, 46, 0].map((x, i) => (
            <div key={i} className="size-16 rounded-full bg-sunken" style={{ transform: `translateX(${x}px)` }} />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-56 rounded-xl bg-sunken" />
        <div className="h-40 rounded-xl bg-sunken" />
      </div>
    </div>
  );
}
