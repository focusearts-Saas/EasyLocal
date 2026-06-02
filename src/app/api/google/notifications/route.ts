import { NextResponse } from 'next/server';
import { setPubSubTopic } from '@/lib/business';

export async function POST(req: Request) {
  try {
    const { accountId, topicName } = await req.json();
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    if (!accountId || !topicName) {
      return NextResponse.json({ error: 'Faltam parâmetros accountId ou topicName' }, { status: 400 });
    }

    const result = await setPubSubTopic(accountId, topicName, token);

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Erro na API /google/notifications:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
