import {requireUser} from '@/lib/auth';
import {getArenaProfile,getFriendRanking,listDuels} from '@/lib/arena';
import {getFriends,getPendingRequests} from '@/lib/friends';
import {ArenaHub} from '@/components/arena-hub';
export const metadata={title:'Друзья и арена'};
export const dynamic='force-dynamic';
export default async function FriendsPage(){const u=await requireUser();const[profile,ranking,friends,pending,duels]=await Promise.all([getArenaProfile(u.id),getFriendRanking(u.id),getFriends(u.id),getPendingRequests(u.id),listDuels(u.id)]);return <><header className="page-heading"><div><span className="heading-eyebrow">МАЛЕНЬКАЯ КОМАНДА. БОЛЬШИЕ ЦЕЛИ.</span><h1>Растём вместе</h1><p>Поддерживайте друг друга, собирайте опыт и встречайтесь на арене.</p></div></header><ArenaHub userId={u.id} profile={profile} ranking={ranking} friends={friends} incoming={pending.incoming} outgoing={pending.outgoing} duels={duels}/></>}
