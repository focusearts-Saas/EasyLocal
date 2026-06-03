const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkClients() {
  console.log("🔍 Buscando negócios cadastrados no banco de dados...");
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, gbp_location_id, owner_whatsapp');

    if (error) throw error;

    console.log(`\nFound ${clients.length} clients in database:`);
    clients.forEach(c => {
      console.log(`- Nome: ${c.name}`);
      console.log(`  ID: ${c.id}`);
      console.log(`  Location ID (Google): ${c.gbp_location_id}`);
      console.log(`  WhatsApp: ${c.owner_whatsapp}`);
      console.log('-----------------------------');
    });
  } catch (err) {
    console.error("❌ Erro ao listar clientes:", err.message);
  }
}

checkClients();
