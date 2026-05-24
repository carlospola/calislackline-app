export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    console.log('Request received, messages count:', body?.messages?.length);
    console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1000,
        system: body.system,
        messages: body.messages
      })
    });

    const text = await response.text();
    console.log('Anthropic raw response:', text.substring(0, 200));
    
    return res.status(200).json(JSON.parse(text));

  } catch(err) {
    console.log('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
