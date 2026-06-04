import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o cliente do Supabase com Service Role para bypass de RLS no webhook
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // O Google Pub/Sub envia a mensagem dentro de body.message.data codificada em Base64
    if (!body.message || !body.message.data) {
      return NextResponse.json({ error: 'Payload inválido do Pub/Sub' }, { status: 400 });
    }

    // Decodifica o payload base64
    const decodedData = Buffer.from(body.message.data, 'base64').toString('utf-8');
    const notification = JSON.parse(decodedData);

    console.log('🔔 Nova notificação do GBP recebida:', notification);

    // O Pub/Sub para GBP normalmente envia a location no formato: "locations/12345"
    // e os dados da avaliação
    const locationName = notification.locationName;
    const reviewData = notification.review;

    if (!locationName || !reviewData) {
      return NextResponse.json({ success: true, note: 'Notificação ignorada (não é review)' });
    }

    const locationId = locationName.replace('locations/', '');

    // Busca o cliente no banco de dados para pegar o WhatsApp do dono
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('name, owner_whatsapp')
      .eq('gbp_location_id', locationId)
      .maybeSingle();

    if (clientError || !client) {
      console.error('Cliente não encontrado para o locationId:', locationId);
      // Retorna 200 pro Google parar de tentar enviar, mesmo que não achemos o cliente
      return NextResponse.json({ success: true });
    }

    if (!client.owner_whatsapp) {
      console.log('Cliente encontrado, mas sem WhatsApp configurado:', client.name);
      return NextResponse.json({ success: true });
    }

    // Se temos o webhook do n8n configurado nas variáveis de ambiente, dispara pra lá
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

    let triggered = false;
    if (n8nWebhookUrl) {
      const n8nRes = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: client.name,
          owner_whatsapp: client.owner_whatsapp,
          reviewer_name: reviewData.reviewer?.displayName || 'Cliente',
          rating: reviewData.starRating || 5,
          comment: reviewData.comment || '(Avaliação sem texto)',
          create_time: reviewData.createTime
        })
      });
      triggered = true;
      console.log('✅ Webhook disparado para n8n com sucesso! Status:', n8nRes.status);
    } else {
      console.warn('⚠️ N8N_WEBHOOK_URL não está configurada no servidor Vercel!');
    }

    return NextResponse.json({ success: true, triggered, hasWpp: !!client.owner_whatsapp, webhookUrl: n8nWebhookUrl });
  } catch (error: any) {
    console.error('Erro no webhook Pub/Sub:', error);
    // Retornamos 200 mesmo no erro genérico para evitar retentativas infinitas do Pub/Sub se for erro de parse
    return NextResponse.json({ success: true, error: error.message || 'Erro interno capturado' });
  }
}

// Método GET para disparar testes rápidos diretamente pelo navegador
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get('locationId') || '4352768185514565207'; // Elivan por padrão
    const comment = searchParams.get('comment') || 'Excelente atendimento, recomendo muito!';
    const reviewerName = searchParams.get('reviewer') || 'Cliente de Teste';
    const ratingVal = parseInt(searchParams.get('rating') || '5', 10);

    console.log('🧪 Executando teste manual do webhook para localização:', locationId);

    // Busca o cliente no banco de dados para pegar o WhatsApp do dono
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('name, owner_whatsapp')
      .eq('gbp_location_id', locationId)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json({ 
        success: false, 
        error: `Cliente com locationId ${locationId} não encontrado no banco de dados.` 
      }, { status: 404 });
    }

    if (!client.owner_whatsapp) {
      return NextResponse.json({ 
        success: false, 
        error: `Cliente ${client.name} encontrado, mas não possui WhatsApp cadastrado.` 
      }, { status: 400 });
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    let triggered = false;
    let n8nStatus = 0;

    if (n8nWebhookUrl) {
      const n8nRes = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: client.name,
          owner_whatsapp: client.owner_whatsapp,
          reviewer_name: reviewerName,
          rating: ratingVal,
          comment: comment,
          create_time: new Date().toISOString()
        })
      });
      triggered = true;
      n8nStatus = n8nRes.status;
    }

    return NextResponse.json({
      message: '🧪 Teste disparado com sucesso!',
      business: client.name,
      target_whatsapp: client.owner_whatsapp,
      n8n_triggered: triggered,
      n8n_webhook_url: n8nWebhookUrl,
      n8n_status: n8nStatus,
      payload_sent: {
        reviewer_name: reviewerName,
        rating: ratingVal,
        comment: comment
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

