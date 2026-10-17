import { ArrowUpRight, BookOpen, ClipboardCheck, MousePointer2, PlayCircle } from "lucide-react";
import type { Lesson, LessonResource } from "@/content/types";

const RESOURCE_KIND: Record<LessonResource["kind"], { label: string; icon: typeof BookOpen }> = {
  guide: { label: "Инструкция", icon: BookOpen },
  video: { label: "Видео", icon: PlayCircle },
  interactive: { label: "Интерактивный тур", icon: MousePointer2 },
  practice: { label: "Практика", icon: ClipboardCheck },
};

export function TutorialMaterials({ tutorial }: { tutorial: NonNullable<Lesson["tutorial"]> }) {
  return (
    <section className="mt-8 rounded-xl border border-line bg-surface p-4" aria-labelledby="tutorial-materials-title">
      <h2 id="tutorial-materials-title" className="text-[15px] font-semibold">Материалы к уроку</h2>
      <p className="mt-1 text-xs text-muted">Официальные источники. Инструкции и видео — на английском; пошаговое объяснение выше — на русском.</p>
      <ul className="mt-3 space-y-1">
        {tutorial.resources.map((resource) => {
          const { icon: Icon, label } = RESOURCE_KIND[resource.kind];
          return <li key={resource.url}><a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-sunken">
            <Icon className="size-4 flex-none text-math" />
            <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{resource.title}</span><span className="block text-xs text-muted">{resource.publisher} · {label}</span></span>
            <ArrowUpRight className="size-4 flex-none text-subtle" />
          </a></li>;
        })}
      </ul>
    </section>
  );
}
