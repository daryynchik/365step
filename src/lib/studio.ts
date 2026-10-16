import {all,one,run,transaction,num,str,json} from './db';
import {STUDIO_MONTHS} from './studio-content';
import {awardXp,touchStreak} from './gamification';
import {nowIso} from './date';
import {lockUser} from './arena';
export interface StudioDraft {month:number;title:string;body:string;sources:string;checklist:boolean[];status:string;revision:number;updatedAt:string}
export async function getStudioDrafts(userId:string):Promise<StudioDraft[]>{return(await all('SELECT * FROM studio_submissions WHERE user_id=? ORDER BY month_index',[userId])).map(r=>({month:num(r.month_index),title:str(r.title),body:str(r.body),sources:str(r.sources),checklist:json<boolean[]>(r.checklist,[]),status:str(r.status),revision:num(r.revision),updatedAt:str(r.updated_at)}))}
export function wordCount(text:string){return text.trim().split(/\s+/u).filter(Boolean).length}
export interface DraftInput {month:number;title:string;body:string;sources:string;checklist:boolean[];revision:number;submit:boolean}
export async function saveStudioDraft(userId:string,input:DraftInput){
 const month=STUDIO_MONTHS.find(m=>m.month===input.month);
 if(!month||typeof input.title!=='string'||typeof input.body!=='string'||typeof input.sources!=='string'||!Array.isArray(input.checklist)||input.checklist.length!==4||input.checklist.some(x=>typeof x!=='boolean')||typeof input.submit!=='boolean'||!Number.isInteger(input.revision)||input.revision<0)return {ok:false,error:'Проверь поля работы.'};
 if(input.title.length>160||input.body.length>80000||input.sources.length>15000)return {ok:false,error:'Работа слишком большая. Лимит: 80 000 символов текста и 15 000 символов источников.'};
 return transaction(async()=>{await lockUser(userId);const existing=await one('SELECT * FROM studio_submissions WHERE user_id=? AND month_index=?',[userId,input.month]);
 if(num(existing?.revision)!==input.revision)return {ok:false,error:'Работа изменена в другой вкладке. Сначала скачай текущий текст, затем обнови страницу.'};
 if(input.submit){
  if(!input.title.trim()||wordCount(input.body)<month.minWords)return {ok:false,error:`Добавь название и не менее ${month.minWords} слов.`};
  if(input.checklist.some(x=>!x))return {ok:false,error:'Проверь работу по всем четырём критериям.'};
  if(!/https?:\/\/\S+/i.test(input.sources))return {ok:false,error:'Добавь хотя бы одну проверяемую ссылку на источник.'};
  if(input.month>1&&!await one("SELECT user_id FROM studio_submissions WHERE user_id=? AND month_index=? AND status='submitted'",[userId,input.month-1]))return {ok:false,error:'Сначала заверши работу предыдущего месяца.'};
  if(!await one("SELECT lp.id FROM lesson_progress lp JOIN lessons l ON l.id=lp.lesson_id JOIN courses c ON c.id=l.course_id WHERE lp.user_id=? AND c.slug=? AND lp.status='completed'",[userId,`studio-${input.month}`]))return {ok:false,error:'Сначала пройди урок и проверку знаний этого месяца.'};
 }
 const revision=input.revision+1;const status=input.submit||existing?.status==='submitted'?'submitted':'draft';
 await run(`INSERT INTO studio_submissions(user_id,month_index,title,body,sources,checklist,status,revision,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,month_index) DO UPDATE SET title=excluded.title,body=excluded.body,sources=excluded.sources,checklist=excluded.checklist,status=excluded.status,revision=excluded.revision,updated_at=excluded.updated_at`,[userId,input.month,input.title.trim(),input.body,input.sources,JSON.stringify(input.checklist),status,revision,nowIso()]);
 const firstSubmit=input.submit&&existing?.status!=='submitted';
 if(firstSubmit){await awardXp(userId,80,'Работа месяца завершена','studio',String(input.month));await touchStreak(userId)}
 return {ok:true,revision,status,xp:firstSubmit?80:0};});
}
