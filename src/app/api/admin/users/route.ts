import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function verifyAdmin(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const userSb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  const { data: { user } } = await userSb.auth.getUser();
  if (!user) return null;

  const { data: roleRow } = await adminSupabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleRow?.role !== 'super_admin') return null;
  return user;
}

// GET /api/admin/users — lista todos os usuários com status e clientes
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  // Buscar todos os usuários via Auth Admin
  const { data: authData, error: authError } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const users = authData.users;
  const userIds = users.map(u => u.id);

  // Buscar roles e status de todos os usuários de uma vez
  const [{ data: roles }, { data: credits }, { data: clients }] = await Promise.all([
    adminSupabase.from('user_roles').select('user_id, role').in('user_id', userIds),
    adminSupabase.from('user_credits').select('user_id, subscription_status, seo_allowed, monthly_allowance').in('user_id', userIds),
    adminSupabase.from('clients').select('user_id, name').in('user_id', userIds),
  ]);

  const rolesMap = Object.fromEntries((roles || []).map(r => [r.user_id, r.role]));
  const creditsMap = Object.fromEntries((credits || []).map(c => [c.user_id, c]));
  const clientsMap: Record<string, string[]> = {};
  (clients || []).forEach(c => {
    if (!clientsMap[c.user_id]) clientsMap[c.user_id] = [];
    clientsMap[c.user_id].push(c.name);
  });

  const result = users.map(u => ({
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in: u.last_sign_in_at,
    role: rolesMap[u.id] || 'user',
    subscription_status: creditsMap[u.id]?.subscription_status || 'pending',
    seo_allowed: creditsMap[u.id]?.seo_allowed || false,
    monthly_allowance: creditsMap[u.id]?.monthly_allowance || 150,
    clients: clientsMap[u.id] || [],
  }));

  // Ordenar: super_admin primeiro, depois active, depois pending
  result.sort((a, b) => {
    if (a.role === 'super_admin') return -1;
    if (b.role === 'super_admin') return 1;
    if (a.subscription_status === 'active' && b.subscription_status !== 'active') return -1;
    if (b.subscription_status === 'active' && a.subscription_status !== 'active') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return NextResponse.json({ users: result });
}

// PATCH /api/admin/users — atualizar status ou role de um usuário
export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const body = await req.json();
  const { userId, subscription_status, seo_allowed, role } = body;

  if (!userId) return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });


  // Atualizar assinatura se fornecido
  if (subscription_status !== undefined || seo_allowed !== undefined) {
    const creditsUpdate: any = {};
    if (subscription_status !== undefined) creditsUpdate.subscription_status = subscription_status;
    if (seo_allowed !== undefined) creditsUpdate.seo_allowed = seo_allowed;

    const { data: existing } = await adminSupabase
      .from('user_credits')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await adminSupabase.from('user_credits').update(creditsUpdate).eq('user_id', userId);
    } else {
      await adminSupabase.from('user_credits').insert([{
        user_id: userId,
        monthly_allowance: 150,
        purchased_credits: 0,
        subscription_status: subscription_status || 'pending',
        seo_allowed: seo_allowed || false
      }]);
    }
  }

  // Atualizar role se fornecido
  if (role !== undefined) {
    const { data: existingRole } = await adminSupabase
      .from('user_roles')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingRole) {
      await adminSupabase.from('user_roles').update({ role }).eq('user_id', userId);
    } else {
      await adminSupabase.from('user_roles').insert([{ user_id: userId, role }]);
    }
  }


  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users — deletar usuário permanentemente
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId é obrigatório.' }, { status: 400 });

  // Não pode deletar a si mesmo
  if (userId === admin.id) {
    return NextResponse.json({ error: 'Você não pode deletar sua própria conta.' }, { status: 400 });
  }

  const { error } = await adminSupabase.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
