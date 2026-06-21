const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfhcsqooftpkohpplubl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaGNzcW9vZnRwa29ocHBsdWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE3ODUyNywiZXhwIjoyMDkzNzU0NTI3fQ.TWuOlWkTVdNoCtASYtFpdLO5-3epNkJvMwQcHFSJeXg'
);

async function main() {
  const targetEmail = 'maggioonofre@gmail.com';
  console.log(`🔍 Buscando dados de ${targetEmail}...\n`);

  // 1. Buscar user
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === targetEmail);
  if (!user) { console.log('❌ Usuário não encontrado'); return; }
  console.log(`✅ User ID: ${user.id}`);

  // 2. Verificar google_integrations
  const { data: integration } = await supabase
    .from('google_integrations')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  console.log('\n📡 Google Integration:', integration
    ? `✅ Conectado com ${integration.google_email}`
    : '❌ SEM integração Google no banco');

  // 3. Verificar clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, gbp_data, gsc_url, owner_whatsapp')
    .eq('user_id', user.id);
  
  console.log(`\n🏪 Clientes cadastrados (${clients?.length || 0}):`);
  clients?.forEach(c => {
    console.log(`  - ${c.name}`);
    console.log(`    gsc_url: ${c.gsc_url || 'NENHUM'}`);
    console.log(`    gbp_data: ${c.gbp_data ? JSON.stringify(c.gbp_data).substring(0, 120) + '...' : 'NULO'}`);
    console.log(`    owner_whatsapp: ${c.owner_whatsapp || 'não definido'}`);
  });

  // 4. Verificar status de assinatura
  const { data: credits } = await supabase
    .from('user_credits')
    .select('subscription_status, seo_allowed')
    .eq('user_id', user.id)
    .maybeSingle();
  console.log(`\n💳 Assinatura: ${credits?.subscription_status || 'NÃO CADASTRADO'}`);

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  console.log(`👤 Role: ${role?.role || 'NÃO CADASTRADO'}`);
}

main().catch(console.error);
