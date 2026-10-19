import { ArenaTabs } from "@/components/arena/arena-tabs";

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Соревнования</h1>
          <p className="max-w-2xl text-sm text-muted">Учебные гонки по SAT и IELTS с учениками твоего уровня. Монеты за занятия и соревнования тратятся на аксессуары для героя.</p>
        </div>
        <ArenaTabs />
      </div>
      {children}
    </div>
  );
}
