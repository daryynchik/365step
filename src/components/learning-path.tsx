import Link from "next/link";
import { Check, Play, LockKeyhole, Flag, BookOpen, ArrowRight } from "lucide-react";
export interface PathLesson { id:string; slug:string; title:string; estMinutes:number; xp:number; completed:boolean }
export function LearningPath({lessons,courseSlug}:{lessons:PathLesson[];courseSlug:string}) {
 const next = lessons.findIndex(l=>!l.completed);
 return <div className="learning-path"><div className="path-stem" aria-hidden="true"/><ol>{lessons.map((lesson,i)=>{
 const current=i===next; const locked=next>=0&&i>next; const Icon=lesson.completed?Check:locked?LockKeyhole:Play;
 return <li key={lesson.id} className={`path-step step-${i%4} ${current?'current':''} ${lesson.completed?'complete':''} ${locked?'locked':''}`}>
 <div className="path-node-wrap">{current&&<span className="you-are-here">ТЫ ЗДЕСЬ</span>}{locked?<span className="path-node" aria-label="Сначала предыдущий урок"><Icon size={23}/></span>:<Link className="path-node" href={`/learn/${courseSlug}/${lesson.slug}`} aria-label={lesson.title}><Icon size={25} fill={current?'currentColor':'none'} strokeWidth={2.5}/></Link>}</div>
 <div className="path-label"><span className="path-number">УРОК {String(i+1).padStart(2,'0')}</span><h3>{lesson.title}</h3><p>{lesson.estMinutes} мин · {lesson.xp} XP {lesson.completed?'· Пройдено':''}</p>{current&&<Link href={`/learn/${courseSlug}/${lesson.slug}`}>Продолжить <ArrowRight size={14}/></Link>}</div>
 </li>})}</ol><div className="path-finish"><span><Flag size={23}/></span><div><strong>Ещё один навык в копилке</strong><p>Заверши дорожку и переходи к следующему курсу.</p></div><BookOpen size={19}/></div></div>
}
