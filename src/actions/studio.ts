"use server";
import {revalidatePath} from 'next/cache';
import {requireUser} from '@/lib/auth';
import {saveStudioDraft,type DraftInput} from '@/lib/studio';
export async function saveStudioAction(input:DraftInput){const user=await requireUser();const result=await saveStudioDraft(user.id,input);if(result.ok){revalidatePath('/projects');revalidatePath('/dashboard');revalidatePath('/compete');revalidatePath('/progress')}return result}
