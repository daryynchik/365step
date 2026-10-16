"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { Route, NotebookPen, Users, ArrowUpRight, LogOut, Flame, Sprout, BookOpen } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { Logo } from "./ui";
const NAV = [
  { href: "/dashboard", label: "Мой путь", icon: Route },
  { href: "/projects", label: "Мой проект", icon: NotebookPen },
  { href: "/compete", label: "Друзья", icon: Users },
];
export interface ShellUser { name: string; level: number; levelTitle: string; totalXp: number; streak: number; dayIndex: number }
export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const [pending, start] = useTransition();
  const active = pathname.startsWith('/projects') ? '/projects' : pathname.startsWith('/compete') ? '/compete' : '/dashboard';
  return <div className="app-layout">
    <aside className="side-rail">
      <Link href="/dashboard" aria-label="365step — главная"><Logo className="text-[25px]" /></Link>
      <div className="workspace-label"><span className="workspace-icon"><Sprout size={18}/></span><div><strong>Личное пространство</strong><small>Маленькие шаги. Большие цели.</small></div></div>
      <p className="nav-caption">КАЖДЫЙ ДЕНЬ НЕМНОГО ВПЕРЁД</p>
      <nav aria-label="Основная навигация">{NAV.map(({href,label,icon:Icon})=><Link key={href} href={href} className={`rail-link ${active===href?'active':''}`} aria-current={active===href?'page':undefined}><Icon size={19}/><span>{label}</span>{active===href&&<span className="active-dot"/>}</Link>)}</nav>
      <div className="rail-note"><div className="flex items-center gap-2"><BookOpen size={17}/><strong>Твой темп — правильный</strong></div><p>Даже один урок сегодня — это шаг, которого вчера ещё не было.</p><Link href="/learn">Все курсы <ArrowUpRight size={14}/></Link></div>
      <div className="rail-footer"><Link href="/progress" className="profile-link"><span className="profile-avatar">{user.name.slice(0,1).toUpperCase()}</span><span><strong>{user.name}</strong><small>Уровень {user.level} · {user.totalXp.toLocaleString('ru')} XP</small></span></Link><button disabled={pending} title="Выйти" aria-label="Выйти из аккаунта" onClick={()=>start(()=>signOutAction())}><LogOut size={17}/></button></div>
    </aside>
    <div className="main-wrap"><header className="top-bar"><div className="desktop-breadcrumb">Твоё пространство <span>/</span> <strong>{NAV.find(n=>n.href===active)?.label}</strong></div><Link href="/dashboard" className="mobile-brand"><Logo/></Link><div className="top-stats"><span><Flame size={16}/> {user.streak} <span className="hide-small">дней подряд</span></span><span className="top-xp">✦ {user.totalXp.toLocaleString('ru')} XP</span><Link href="/progress" className="small-avatar" aria-label="Мой прогресс">{user.name.slice(0,1)}</Link></div></header>
      <main className="page-content">{children}</main>
    </div>
    <nav className="mobile-nav" aria-label="Мобильная навигация">{NAV.map(({href,label,icon:Icon})=><Link key={href} href={href} className={active===href?'active':''} aria-current={active===href?'page':undefined}><Icon size={21}/>{label}</Link>)}</nav>
  </div>;
}
