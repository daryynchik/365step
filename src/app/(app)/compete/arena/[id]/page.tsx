import Link from 'next/link';
import {notFound} from 'next/navigation';
import {requireUser} from '@/lib/auth';
import {getDuel,listDuels} from '@/lib/arena';
import {DuelPlayer} from '@/components/duel-player';
export const dynamic='force-dynamic';
export const metadata={title:'Дружеская арена'};
export default async function ArenaPage({params}:{params:Promise<{id:string}>}){const u=await requireUser();const{id}=await params;await listDuels(u.id);const duel=await getDuel(u.id,id);if(!duel)notFound();return <><Link href="/compete" className="quiet-button" style={{marginBottom:20}}>← К друзьям</Link><DuelPlayer duel={duel} userId={u.id}/></>}
