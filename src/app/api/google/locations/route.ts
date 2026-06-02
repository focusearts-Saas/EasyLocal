import { NextResponse } from 'next/server';
import { listLocations } from '@/lib/business';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado. Token ausente.' }, { status: 401 });
    }

    // Identificar usuário autenticado no Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }

    console.log(`📡 Listando locais do Google para o usuário: ${user.email}`);
    const locations = await listLocations(token);

    // Formatar a resposta para o frontend
    const formattedLocations = locations.map((loc: any) => ({
      name: loc.title,
      gbpLocationId: loc.name.replace('locations/', '').replace(/^accounts\/[^/]+\//, ''),
      gbpAccountId: loc.accountId,
      websiteUrl: loc.websiteUri || null
    }));

    return NextResponse.json(formattedLocations);
  } catch (error: any) {
    console.error('Erro ao listar localizações do Google:', error);
    return NextResponse.json({ error: error.message || 'Falha ao buscar locais do Google Meu Negócio' }, { status: 500 });
  }
}
