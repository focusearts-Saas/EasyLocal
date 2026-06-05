async function testWebhook() {
  const payload = {
    message: {
      data: Buffer.from(JSON.stringify({
        locationName: "locations/4352768185514565207", // Elivan Auto eletrica location ID
        review: {
          reviewer: {
            displayName: "Skedar Music (Teste Real)"
          },
          starRating: "FIVE",
          comment: "honesto e preço justo, recomendo",
          createTime: new Date().toISOString()
        }
      })).toString('base64')
    }
  };

  console.log("🚀 Enviando requisição de teste simulado real para o Webhook da Vercel...");
  try {
    const res = await fetch('https://easy-local-omega.vercel.app/api/webhooks/google-pubsub', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const status = res.status;
    const text = await res.text();

    console.log(`\nStatus da resposta: ${status}`);
    console.log(`Corpo da resposta:\n${text}`);
  } catch (err) {
    console.error("❌ Erro ao enviar requisição:", err.message);
  }
}

testWebhook();
