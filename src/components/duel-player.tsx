"use client";
import {useEffect,useState,useTransition} from 'react';
import {useRouter} from 'next/navigation';
import {Swords,Shield,Zap} from 'lucide-react';
import {playMoveAction,respondDuelAction} from '@/actions/arena';
import type {DuelView} from '@/lib/arena';
import type {Move} from '@/lib/arena-rules';
import {PlayerAvatar} from './player-avatar';
export function DuelPlayer({duel,userId}:{duel:DuelView;userId:string}){
 const router=useRouter();const[pending,start]=useTransition();const[error,setError]=useState('');const mine=duel.turnId===userId;
 useEffect(()=>{if(!['active','pending'].includes(duel.status))return;const timer=setInterval(()=>{if(!document.hidden)router.refresh()},5000);return()=>clearInterval(timer)},[duel.status,router]);
 function move(m:Move){start(async()=>{try{const r=await playMoveAction(duel.id,m,duel.version);setError(r.ok?'':r.error??'Не удалось сделать ход');router.refresh()}catch{setError('Соединение прервано. Обнови страницу.')}})}
 return <section className="studio-panel"><span className="small-label">ДРУЖЕСКАЯ АРЕНА · ХОД {duel.state.round+1}</span><h2>{duel.status==='completed'?(duel.winnerId===userId?'Победа!':duel.winnerId?'Хороший бой!':'Дружеская ничья'):duel.status==='active'?(mine?'Твой ход':'Сейчас ход друга'):duel.status==='pending'?'Друг ещё не принял вызов':'Этот бой закрыт'}</h2><div className="duel-stage">{duel.state.fighters.map(f=><div key={f.id}><PlayerAvatar weapon={f.weapon} shield={f.shield} opponent={f.id!==userId} animate={pending&&f.id===userId}/><div className="section-top"><strong>{f.name}{f.id===userId?' · ты':''}</strong><span className="count-pill">{f.hp} / 100 HP</span></div><div className="calm-progress"><i style={{width:`${f.hp}%`}}/></div>{f.guarding&&<p className="tiny-note">Щит поднят</p>}</div>)}</div>
 {duel.status==='pending'&&duel.opponentId===userId&&<button disabled={pending} className="primary-button" style={{marginTop:20}} onClick={()=>start(async()=>{const r=await respondDuelAction(duel.id,true);if(!r.ok)setError(r.error??'Ошибка');router.refresh()})}>Принять вызов</button>}
 {duel.status==='active'&&<><div className="duel-controls">{([{id:'attack',label:'Атака',icon:Swords},{id:'guard',label:'Защита',icon:Shield},{id:'break',label:'Пробитие',icon:Zap}] as const).map(({id,label,icon:Icon})=><button key={id} disabled={!mine||pending} className="primary-button" onClick={()=>move(id)}><Icon size={16}/>{label}</button>)}</div><p className="notice">Атака: 20 + оружие. Защита: +4 HP и −14 урона следующей атаки. Пробитие: 27 против защиты, иначе 9. Щит снижает урон. Минимум 4 урона. После 60 ходов — ничья.</p></>}
 <div className="battle-log" aria-live="polite">{duel.state.log.map((l,i)=><div key={`${duel.version}-${i}`}>{l}</div>)}</div>{error&&<p className="notice" role="alert">{error}</p>}</section>
}
