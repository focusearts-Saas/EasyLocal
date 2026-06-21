/**
 * Script para forçar a sincronização das fichas GBP da Maggie
 * Ela tem integração Google mas 0 clientes no banco.
 * Este script vai chamar a API de sites com o token dela para disparar a descoberta automática.
 * 
 * Como este script roda localmente, precisamos simular o token da Maggie
 * usando o service_role para gerar um JWT de serviço e chamar a API.
 */
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = 'https://pfhcsqooftpkohpplubl.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmaGNzcW9vZnRwa29ocHBsdWJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE3ODUyNywiZXhwIjoyMDkzNzU0NTI3fQ.TWuOlWkTVdNoCtASYtFpdLO5-3epNkJvMwQcHFSJeXg';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET;

const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function getGoogleAccessToken(refreshToken) {
  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error('Erro ao obter access token:', data);
    return null;
  }
  return data.access_token;
}

async function listGBPLocations(accessToken) {
  const accountsRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const accountsData = await accountsRes.json();
  console.log('Contas GBP:', JSON.stringify(accountsData, null, 2));

  if (!accountsData.accounts) return [];

  let all = [];
  for (const account of accountsData.accounts) {
    const locRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,websiteUri,metadata,storefrontAddress`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const locData = await locRes.json();
    console.log(`Locais da conta ${account.name}:`, JSON.stringify(locData, null, 2));
    if (locData.locations) {
      const accountId = account.name.split('/')[1];
      all.push(...locData.locations.map(l => ({ ...l, accountId })));
    }
  }
  return all;
}

async function main() {
  const targetEmail = 'maggioonofre@gmail.com';
  console.log(`\n🔧 Sincronizando fichas GBP de ${targetEmail}...\n`);

  // 1. Buscar o user
  const { data: users } = await adminSupabase.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === targetEmail);
  if (!user) { console.log('❌ Usuário não encontrado'); return; }
  console.log(`✅ User ID: ${user.id}`);

  // 2. Buscar o refresh_token da integração
  const { data: integration } = await adminSupabase
    .from('google_integrations')
    .select('refresh_token, google_email')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!integration?.refresh_token) {
    console.log('❌ Sem refresh_token na integração!');
    return;
  }
  console.log(`📡 Refresh token encontrado para: ${integration.google_email}`);

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.log('\n⚠️  GOOGLE_ADS_CLIENT_ID e GOOGLE_ADS_CLIENT_SECRET não definidos como env vars.');
    console.log('   Execute com: $env:GOOGLE_ADS_CLIENT_ID="seu_id"; $env:GOOGLE_ADS_CLIENT_SECRET="seu_secret"; node sync_maggie.js');
    
    // Mesmo sem as credenciais, mostramos as infos de debug do banco
    console.log('\n📋 Dados da integração:');
    console.log('   Refresh token (primeiros 20 chars):', integration.refresh_token.substring(0, 20) + '...');
    console.log('\n💡 Solução alternativa: Instrua a Maggie a acessar o EasyLocal,');
    console.log('   ir em Integrações e clicar em "Sincronizar Novos Perfis".');
    console.log('   O código do servidor tem acesso às credenciais da API.');
    return;
  }

  // 3. Obter access token
  const accessToken = await getGoogleAccessToken(integration.refresh_token);
  if (!accessToken) { console.log('❌ Falha ao obter access token do Google'); return; }
  console.log(`✅ Access token obtido com sucesso!`);

  // 4. Listar locais GBP
  const locations = await listGBPLocations(accessToken);
  console.log(`\n📍 ${locations.length} local(is) GBP encontrado(s):`);
  locations.forEach(l => console.log(`  - ${l.title || l.name} (Account: ${l.accountId})`));

  if (locations.length === 0) {
    console.log('\n⚠️  Nenhum local GBP encontrado. Possíveis causas:');
    console.log('  1. A conta do Google não tem fichas no Google Meu Negócio');
    console.log('  2. As fichas estão em outra conta de email');
    console.log('  3. A API retornou erro (verifique os logs acima)');
    return;
  }

  // 5. Inserir clientes no banco
  for (const loc of locations) {
    const locationId = loc.name.replace('locations/', '').replace(/^accounts\/[^/]+\//, '');
    const client = {
      name: loc.title || 'Negócio sem nome',
      gbp_location_id: locationId,
      gbp_account_id: loc.accountId,
      website_url: loc.websiteUri || null,
      user_id: user.id
    };
    console.log(`\n💾 Inserindo cliente: ${client.name}`);
    const { data, error } = await adminSupabase.from('clients').insert([client]).select();
    if (error) {
      console.log(`  ❌ Erro: ${error.message}`);
    } else {
      console.log(`  ✅ Cliente inserido com ID: ${data[0].id}`);
    }
  }

  console.log('\n🎉 Sincronização concluída! A Maggie pode recarregar o EasyLocal e ver seus clientes.');
}

main().catch(console.error);
