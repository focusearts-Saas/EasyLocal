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

    if (n8nWebhookUrl) {
      await fetch(n8nWebhookUrl, {
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
      console.log('✅ Webhook disparado para n8n com sucesso!');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no webhook Pub/Sub:', error);
    // Retornamos 200 mesmo no erro genérico para evitar retentativas infinitas do Pub/Sub se for erro de parse
    return NextResponse.json({ success: true, error: 'Erro interno capturado' });
  }
}
