import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, BookOpen, Check, Clock3, Flag, Leaf, Target, Users } from "lucide-react";
import { currentUser } from "@/lib/auth";
import { getCoursesWithProgress, getPrimaryGoal, getProfile, getSnapshot, getLessons, getLessonProgressMap, getActivityHistory } from "@/lib/queries";
import { LearningPath } from "@/components/learning-path";
import { getFriendRanking } from "@/lib/arena";
import { todayIso } from "@/lib/date";
export const metadata: Metadata={title:"Мой путь"};
export const dynamic="force-dynamic";
export default async function DashboardPage({searchParams}:{searchParams:Promise<{course?:string}>}) {
 const user=await currentUser(); if(!user) redirect('/signin');
 const [profile,goal,params,courses,progress,ranking,activity]=await Promise.all([getProfile(user.id),getPrimaryGoal(user.id),searchParams,getCoursesWithProgress(user.id),getLessonProgressMap(user.id),getFriendRanking(user.id),getActivityHistory(user.id,7)]);
 if(!profile||!goal) redirect('/onboarding');
 const snapshot=await getSnapshot(user.id,goal);
 const learning=courses.filter(c=>!c.slug.startsWith('studio-'));
 const course=learning.find(c=>c.slug===params.course)??learning.find(c=>c.nextLessonSlug)??learning[0];
 const lessons=course?await getLessons(course.id):[];
 const next=lessons.find(l=>progress.get(l.id)?.status!=='completed');
 const doneToday=[...progress.values()].filter(p=>p.completedAt?.startsWith(todayIso())).length;
 return <div className="dashboard">
 <header className="page-heading"><div><div className="heading-eyebrow"><span/> ДЕНЬ {snapshot.dayIndex} ИЗ 365</div><h1>Шаг за шагом, {user.name.split(' ')[0]}<span className="heading-leaf"><Leaf size={29}/></span></h1><p>Не нужно успеть всё. Достаточно сделать следующий шаг.</p></div><Link href="/roadmap" className="quiet-button"><Flag size={15}/> Мой план на год <ArrowUpRight size={14}/></Link></header>
 <div className="dashboard-columns"><div className="dashboard-main">
 <section className="continue-card"><div className="continue-copy"><span className="small-label"><span className="live-dot"/> ТВОЙ СЛЕДУЮЩИЙ ШАГ</span><h2>{next?.title??'Отличная работа!'}</h2><p>{next?.objective??'Все уроки этого курса пройдены. Выбери следующую дорожку.'}</p><div className="continue-meta"><span><Clock3 size={14}/> {next?.estMinutes??10} минут</span><span>✦ +{next?.xp??25} XP</span></div><Link className="primary-button" href={next?`/learn/${course.slug}/${next.slug}`:'/learn'}>{next?'Начать урок':'Выбрать курс'} <ArrowRight size={17}/></Link></div><div className="study-art" aria-hidden="true"><div className="art-orbit"/><div className="art-paper"><span/><span/><span/><div className="art-chart"><i/><i/><i/><i/></div><div className="art-check"><Check size={19}/></div></div><div className="art-book"/><div className="art-pencil"/><span className="art-spark one">✦</span><span className="art-spark two">✧</span></div></section>
 <section className="path-card"><div className="path-card-header"><div><span className="small-label">УЧЕБНАЯ ДОРОЖКА</span><h2>{course?.title??'Выбери свой курс'}</h2></div><span className="count-pill">{course?.completedCount??0} / {lessons.length} уроков</span></div><div className="track-switcher" aria-label="Выбор дорожки">{learning.filter(c=>['sat-math','sat-reading','sat-writing','ielts-writing','research-fundamentals'].includes(c.slug)).map(c=><Link key={c.id} className={course?.id===c.id?'selected':''} href={`/dashboard?course=${c.slug}`}>{c.slug==='sat-math'?'SAT · Math':c.slug==='sat-reading'?'SAT · Reading':c.slug==='sat-writing'?'SAT · Writing':c.track==='Research'?'Исследования':'IELTS'}</Link>)}<Link href="/learn">Все курсы <ArrowUpRight size={13}/></Link></div>{course&&<LearningPath courseSlug={course.slug} lessons={lessons.map(l=>({...l,completed:progress.get(l.id)?.status==='completed'}))}/>}</section>
 </div><aside className="dashboard-aside">
 <section className="daily-card"><div className="section-top"><h2>Сегодня — уже ближе</h2><span className="icon-tile"><Target size={19}/></span></div><p className="muted text-sm">Один урок в день. Ты справишься.</p><div className="daily-total"><strong>{Math.min(doneToday,1)}<small> / 1</small></strong><span>урок на сегодня</span></div><div className="calm-progress"><i style={{width:doneToday?'100%':'0%'}}/></div><div className="week-days">{activity.map((d,i)=><div key={d.date}><span>{['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][new Date(d.date+'T12:00:00Z').getUTCDay()]}</span><b className={`${d.xp>0?'done':''} ${i===6?'today':''}`}>{d.xp>0?<Check size={14}/>:i===6?'·':''}</b></div>)}</div><p className="tiny-note">Каждый день считается. Начни с малого.</p></section>
 <section className="side-project"><span className="small-label">ТВОЯ ИССЛЕДОВАТЕЛЬСКАЯ РАБОТА</span><div className="project-drawing"><BookOpen size={29}/><span>12<br/><small>месяцев</small></span></div><h2>От вопроса<br/>к собственному открытию</h2><p>Читай, проверяй источники и пиши свою первую серьёзную работу.</p><Link href="/projects">Открыть мастерскую <ArrowRight size={16}/></Link></section>
 <section className="friends-mini"><div className="section-top"><h2>Растём вместе</h2><Users size={18}/></div>{ranking.slice(0,3).map((friend,i)=><div className="mini-person" key={friend.id}><span className="rank-number">{i+1}</span><span className="small-avatar">{friend.name[0]}</span><strong>{friend.id===user.id?'Ты':friend.name}</strong><span>{friend.weekXp} XP</span></div>)}{ranking.length===1&&<p className="tiny-note">Пригласи друга — учиться вместе интереснее.</p>}<Link href="/compete">Рейтинг друзей <ArrowRight size={14}/></Link></section>
 <a className="official-mini" href="https://satsuite.collegeboard.org/practice/student-question-bank" target="_blank" rel="noreferrer"><span className="official-icon">CB</span><div><strong>Официальная практика SAT</strong><span>Банк заданий College Board</span></div><ArrowUpRight size={16}/></a>
 </aside></div><footer className="dashboard-footer"><Leaf size={14}/> Большой путь складывается из маленьких шагов.<span>365step</span></footer>
 </div>
}
