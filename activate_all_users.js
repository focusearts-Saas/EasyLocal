const { createClient } = require('@supabase/supabase-js');

// Pega as variáveis de ambiente direto da execução (sem precisar da dependência dotenv)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function activateAllUsers() {
  console.log("👑 Script de Ativação Geral de Assinatura e Admin...");
  
  try {
    // 1. Listar os usuários no Auth do Supabase
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      throw listError;
    }

    if (!users || users.length === 0) {
      console.log("❌ Nenhum usuário cadastrado no Supabase Auth. Cadastre-se na tela de registro ou faça login com Google primeiro!");
      return;
    }

    console.log(`\n👥 Encontrados ${users.length} usuários no Supabase:`);
    users.forEach((usr, idx) => {
      console.log(`[${idx + 1}] ID: ${usr.id} | Email: ${usr.email}`);
    });

    console.log("\n🚀 Ativando assinatura e tornando super_admin todos os usuários...");

    for (const usr of users) {
      // Ativar assinatura
      const { error: creditsError } = await supabase
        .from('user_credits')
        .upsert({
          user_id: usr.id,
          monthly_allowance: 150,
          purchased_credits: 0,
          subscription_status: 'active',
          seo_allowed: true
        });

      if (creditsError) {
        console.error(`❌ Erro ao ativar assinatura de ${usr.email}:`, creditsError);
      } else {
        console.log(`✅ Assinatura ativada para ${usr.email}`);
      }

      // Tornar super admin
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: usr.id,
          role: 'super_admin'
        });

      if (roleError) {
        console.error(`❌ Erro ao dar admin para ${usr.email}:`, roleError);
      } else {
        console.log(`👑 ${usr.email} agora é SUPER ADMIN`);
      }
    }

    console.log("\n✨ Todos os usuários foram ativados com sucesso! Pode recarregar o sistema.");
  } catch (err) {
    console.error("❌ Falha crítica ao rodar o script:", err);
  }
}

activateAllUsers();
