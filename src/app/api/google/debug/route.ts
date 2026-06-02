import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/business';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Nenhum token fornecido no header' }, { status: 401 });
    }

    const accessToken = await getAccessToken(token);
    if (!accessToken) {
      return NextResponse.json({ error: 'Falha ao gerar o accessToken do Google' }, { status: 400 });
    }

    const res = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { 'Authorization': `Bearer ${accessToken}` },
      cache: 'no-store'
    });
    
    const data = await res.json();

    return NextResponse.json({ 
      status: res.status, 
      ok: res.ok, 
      data 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
