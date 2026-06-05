const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://pfhcsqooftpkohpplubl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaGNzcW9vZnRwa29ocHBsdWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE3ODUyNywiZXhwIjoyMDkzNzU0NTI3fQ.TWuOlWkTVdNoCtASYtFpdLO5-3epNkJvMwQcHFSJeXg'
);

async function main() {
  // Buscar o user por email via Supabase Auth Admin
  const targetEmail = 'gabriell.amorimlima@gmail.com';
  
  console.log(`🔍 Buscando usuário ${targetEmail} no Supabase Auth...`);
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error("❌ Erro ao listar usuários:", error.message);
    return;
  }
  
  const targetUser = users.users.find(u => u.email === targetEmail);
  if (!targetUser) {
    console.log(`❌ Usuário ${targetEmail} NÃO foi encontrado no Supabase Auth.`);
    console.log(`ℹ️  O banco do EasyLocal tem ${users.users.length} usuários cadastrados.`);
    console.log("\nLista de usuários cadastrados:");
    users.users.forEach(u => {
      console.log(`  - ${u.email} (ID: ${u.id})`);
    });
    return;
  }
  
  console.log(`✅ Usuário encontrado!`);
  console.log(`   Email: ${targetUser.email}`);
  console.log(`   ID: ${targetUser.id}`);
  console.log(`   Criado em: ${targetUser.created_at}`);
  
  // Verificar role atual
  const { data: roleData } = await supabase.from('user_roles').select('*').eq('user_id', targetUser.id).maybeSingle();
  console.log(`   Role atual: ${roleData?.role || 'NÃO CADASTRADO'}`);
  
  // Verificar status de assinatura
  const { data: creditsData } = await supabase.from('user_credits').select('*').eq('user_id', targetUser.id).maybeSingle();
  console.log(`   Status assinatura: ${creditsData?.subscription_status || 'NÃO CADASTRADO'}`);
  
  // Definir como super_admin
  console.log(`\n🔧 Definindo ${targetEmail} como super_admin...`);
  
  if (!roleData) {
    const { error: insertErr } = await supabase.from('user_roles').insert([{ user_id: targetUser.id, role: 'super_admin' }]);
    if (insertErr) {
      console.error("❌ Erro ao inserir role:", insertErr.message);
    } else {
      console.log("✅ Role 'super_admin' inserida com sucesso!");
    }
  } else {
    const { error: updateErr } = await supabase.from('user_roles').update({ role: 'super_admin' }).eq('user_id', targetUser.id);
    if (updateErr) {
      console.error("❌ Erro ao atualizar role:", updateErr.message);
    } else {
      console.log("✅ Role atualizada para 'super_admin' com sucesso!");
    }
  }
  
  // Garantir que a assinatura está ativa
  if (!creditsData) {
    await supabase.from('user_credits').insert([{
      user_id: targetUser.id,
      monthly_allowance: 9999,
      purchased_credits: 0,
      subscription_status: 'active',
      seo_allowed: true
    }]);
    console.log("✅ Status de assinatura 'active' criado com sucesso!");
  } else {
    await supabase.from('user_credits').update({ subscription_status: 'active', seo_allowed: true }).eq('user_id', targetUser.id);
    console.log("✅ Status de assinatura atualizado para 'active'!");
  }
}

main().catch(console.error);
