import { randomUUID } from 'node:crypto';
import {all,one,run,scalar,transaction,dialect,num,str,json} from './db';
import { areFriends } from './friends';
import {nowIso,todayIso,addDays} from './date';
import {EQUIPMENT,resolveMove,type CombatState,type Move} from './arena-rules';
export async function lockUser(userId:string){if(await dialect()==='postgres')await all('SELECT id FROM users WHERE id = ? FOR UPDATE',[userId]);}
export async function getFriendRanking(userId:string){
 const date=new Date(todayIso()+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));const monday=date.toISOString().slice(0,10);
 const rows=await all(`SELECT u.id,u.name,COALESCE(SUM(x.amount),0) AS total_xp,COALESCE(SUM(CASE WHEN x.day_date >= ? THEN x.amount ELSE 0 END),0) AS week_xp FROM users u LEFT JOIN xp_events x ON x.user_id=u.id WHERE u.id=? OR EXISTS (SELECT 1 FROM friendships f WHERE f.status='accepted' AND ((f.user_a=? AND f.user_b=u.id) OR (f.user_b=? AND f.user_a=u.id))) GROUP BY u.id,u.name ORDER BY week_xp DESC,total_xp DESC,u.name ASC,u.id ASC`,[monday,userId,userId,userId]);
 return rows.map(r=>({id:str(r.id),name:str(r.name),totalXp:num(r.total_xp),weekXp:num(r.week_xp)}));
}
export async function getArenaProfile(userId:string){
 const [profile,items,xp]=await Promise.all([one('SELECT weapon,shield FROM arena_profiles WHERE user_id=?',[userId]),all('SELECT item_id,price FROM arena_inventory WHERE user_id=?',[userId]),scalar('SELECT COALESCE(SUM(amount),0) FROM xp_events WHERE user_id=?',[userId])]);
 return {weapon:str(profile?.weapon,'starter'),shield:str(profile?.shield,'starter'),owned:items.map(r=>str(r.item_id)),balance:Math.max(0,xp-items.reduce((n,r)=>n+num(r.price),0)),totalXp:xp};
}
export type ArenaProfile=Awaited<ReturnType<typeof getArenaProfile>>;
export async function buyEquipment(userId:string,itemId:string){
 const item=EQUIPMENT.find(i=>i.id===itemId);if(!item)return {ok:false,error:'Такого предмета нет.'};
 return transaction(async()=>{await lockUser(userId);const profile=await getArenaProfile(userId);
 if(!profile.owned.includes(itemId)){if(profile.balance<item.price)return {ok:false,error:'Пока недостаточно очков. Пройди ещё один урок.'};await run('INSERT INTO arena_inventory(user_id,item_id,price,purchased_at) VALUES(?,?,?,?)',[userId,itemId,item.price,nowIso()]);}
 await run('INSERT INTO arena_profiles(user_id) VALUES(?) ON CONFLICT(user_id) DO NOTHING',[userId]);
 // Slot is chosen from the trusted catalogue, never from a request.
 await run(`UPDATE arena_profiles SET ${item.slot}=? WHERE user_id=?`,[itemId,userId]);return {ok:true};});
}
export interface DuelView {id:string;challengerId:string;opponentId:string;status:string;state:CombatState;turnId:string;winnerId:string|null;version:number}
function mapDuel(r:Record<string,unknown>):DuelView{return {id:str(r.id),challengerId:str(r.challenger_id),opponentId:str(r.opponent_id),status:str(r.status),state:json<CombatState>(r.state,{fighters:[] as unknown as CombatState['fighters'],round:0,log:[]}),turnId:str(r.turn_id),winnerId:r.winner_id?str(r.winner_id):null,version:num(r.version)}}
export async function listDuels(userId:string){
 await run("UPDATE arena_duels SET status='expired' WHERE status IN ('pending','active') AND expires_at < ? AND (challenger_id=? OR opponent_id=?)",[nowIso(),userId,userId]);
 return (await all('SELECT * FROM arena_duels WHERE challenger_id=? OR opponent_id=? ORDER BY created_at DESC LIMIT 30',[userId,userId])).map(mapDuel);
}
export async function getDuel(userId:string,id:string){const row=await one('SELECT * FROM arena_duels WHERE id=? AND (challenger_id=? OR opponent_id=?)',[id,userId,userId]);return row?mapDuel(row):null}
export async function createDuel(userId:string,friendId:string){return transaction(async()=>{
 await lockUser(userId);if(userId===friendId||!await areFriends(userId,friendId))return {ok:false,error:'На арену можно пригласить только друга.'};
 if(await scalar("SELECT COUNT(*) FROM arena_duels WHERE status IN ('pending','active') AND expires_at>? AND ((challenger_id=? AND opponent_id=?) OR (challenger_id=? AND opponent_id=?))",[nowIso(),userId,friendId,friendId,userId]))return {ok:false,error:'У вас уже есть приглашение или незавершённый бой.'};
 const players=await all('SELECT id,name FROM users WHERE id IN (?,?)',[userId,friendId]);
 const fighters=await Promise.all([userId,friendId].map(async id=>{const p=await getArenaProfile(id);return {id,name:str(players.find(p=>p.id===id)?.name),hp:100,weapon:p.weapon,shield:p.shield,guarding:false}}));
 const id=randomUUID();const state:CombatState={fighters:fighters as CombatState['fighters'],round:0,log:['Приглашение отправлено. Экипировка фиксируется при принятии.']};
 await run("INSERT INTO arena_duels(id,challenger_id,opponent_id,status,state,turn_id,created_at,expires_at) VALUES(?,?,?,'pending',?,?,?,?)",[id,userId,friendId,JSON.stringify(state),userId,nowIso(),`${addDays(todayIso(),3)}T00:00:00.000Z`]);return {ok:true,id};});}
export async function respondDuel(userId:string,id:string,accept:boolean){return transaction(async()=>{
 const rows=await all(`SELECT * FROM arena_duels WHERE id=?${await dialect()==='postgres'?' FOR UPDATE':''}`,[id]);const row=rows[0];
 if(!row||row.opponent_id!==userId||row.status!=='pending')return {ok:false,error:'Приглашение недоступно.'};
 if(str(row.expires_at)<nowIso())return {ok:false,error:'Срок приглашения истёк.'};
 if(!await areFriends(userId,str(row.challenger_id)))return {ok:false,error:'Для боя нужно оставаться друзьями.'};
 const state=json<CombatState>(row.state,{} as CombatState);
 for(const fighter of state.fighters){const p=await getArenaProfile(fighter.id);fighter.weapon=p.weapon;fighter.shield=p.shield;}
 state.log=['Бой начался. Атака побеждает пробитие; защита ослабляет атаку; пробитие ломает защиту.'];
 await run('UPDATE arena_duels SET status=?,state=?,version=version+1 WHERE id=?',[accept?'active':'declined',JSON.stringify(state),id]);return {ok:true};});}
export async function playMove(userId:string,id:string,move:Move,version:number){
 if(!['attack','guard','break'].includes(move)||!Number.isInteger(version))return {ok:false,error:'Некорректный ход.'};
 return transaction(async()=>{const rows=await all(`SELECT * FROM arena_duels WHERE id=?${await dialect()==='postgres'?' FOR UPDATE':''}`,[id]);const r=rows[0];
 if(!r||(r.challenger_id!==userId&&r.opponent_id!==userId))return {ok:false,error:'Бой недоступен.'};
 if(r.status!=='active'||r.turn_id!==userId||num(r.version)!==version)return {ok:false,error:'Ход уже изменился. Обнови страницу.'};
 if(str(r.expires_at)<nowIso())return {ok:false,error:'Время боя истекло.'};
 const state=resolveMove(json<CombatState>(r.state,{} as CombatState),userId,move);const defeated=state.fighters.find(f=>f.hp===0);const draw=state.round>=60&&!defeated;const winner=defeated?state.fighters.find(f=>f.hp>0)?.id??null:null;
 if(draw)state.log.push('60 ходов: дружеская ничья.');
 await run('UPDATE arena_duels SET state=?,turn_id=?,status=?,winner_id=?,version=version+1 WHERE id=?',[JSON.stringify(state),state.fighters.find(f=>f.id!==userId)!.id,defeated||draw?'completed':'active',winner,id]);
 // No XP for arena grinding: only learning contributes to ranking and spending balance.
 return {ok:true};});
}
