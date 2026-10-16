"use server";
import { revalidatePath } from 'next/cache';
import {requireUser} from '@/lib/auth';
import {buyEquipment,createDuel,respondDuel,playMove} from '@/lib/arena';
import type {Move} from '@/lib/arena-rules';
export async function buyEquipmentAction(itemId:string){const u=await requireUser();const r=await buyEquipment(u.id,itemId);revalidatePath('/compete');return r;}
export async function createDuelAction(friendId:string){const u=await requireUser();const r=await createDuel(u.id,friendId);revalidatePath('/compete');return r;}
export async function respondDuelAction(id:string,accept:boolean){const u=await requireUser();const r=await respondDuel(u.id,id,accept);revalidatePath('/compete');return r;}
export async function playMoveAction(id:string,move:Move,version:number){const u=await requireUser();const r=await playMove(u.id,id,move,version);revalidatePath('/compete');return r;}
