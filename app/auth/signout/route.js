import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(req) {
  await supabaseServer().auth.signOut();
  return NextResponse.redirect(new URL('/', req.url), { status: 303 });
}
