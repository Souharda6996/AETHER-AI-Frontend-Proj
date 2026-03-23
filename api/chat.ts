import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, messages } = req.body;
  
  // 1. Try Anthropic first
  let apiKey = process.env.ANTHROPIC_API_KEY;
  const isAnthropicTokenValid = apiKey && !apiKey.includes('YOUR-KEY-HERE');

  // 2. Fallback to Groq if Anthropic is placeholder or missing
  const groqKey = process.env.VITE_API_KEY || process.env.GROQ_API_KEY;
  
  let provider = isAnthropicTokenValid ? 'anthropic' : (groqKey ? 'groq' : null);
  let activeKey = isAnthropicTokenValid ? apiKey : groqKey;

  if (!provider || !activeKey) {
    console.error('❌ No valid API key found (Anthropic or Groq)');
    return res.status(500).json({ 
      error: 'API Configuration Error: Please paste your Anthropic or Groq key in the Vercel Environment Variables.' 
    });
  }

  const history = Array.isArray(messages) && messages.length > 0
    ? messages.map((m: any) => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: String(m.content ?? '')
      }))
    : [{ role: 'user', content: message }];

  try {
    let aiRes;
    
    if (provider === 'anthropic') {
      console.log('🤖 Routing to Anthropic (Claude)...');
      aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':      'application/json',
          'x-api-key':         activeKey as string,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:      'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          system:     'You are Aether, a premium AI assistant. Professional, concise, and helpful.',
          messages:   history,
        }),
      });
    } else {
      console.log('🚀 Routing to Groq (Llama-3)...');
      aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${activeKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are Aether, a premium AI assistant. Professional, concise, and helpful.' },
            ...history
          ],
          temperature: 0.7,
        }),
      });
    }

    const data: any = await aiRes.json();
    
    if (!aiRes.ok) {
      console.error(`❌ ${provider} error:`, data?.error?.message || data?.error || 'Unknown error');
      return res.status(aiRes.status).json({ 
        error: `${provider} error: ${data?.error?.message || 'Invalid API Key or Service Limit'}` 
      });
    }

    let reply = '';
    if (provider === 'anthropic') {
      reply = data?.content?.[0]?.text;
    } else {
      reply = data?.choices?.[0]?.message?.content;
    }

    if (!reply?.trim()) {
      return res.status(500).json({ error: 'Empty AI response' });
    }

    console.log(`✅ ${provider} success`);
    return res.status(200).json({ reply });

  } catch (err: any) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
