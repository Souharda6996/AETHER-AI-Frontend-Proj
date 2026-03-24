import type { VercelRequest, VercelResponse } from '@vercel/node';
// Inlined config to prevent path resolution issues on Vercel deployment
const GROQ_MODELS = {
  VISION: "meta-llama/llama-4-scout-17b-16e-instruct",
  VISION_PRO: "meta-llama/llama-4-maverick-17b-128e-instruct",
  TEXT: "llama-3.3-70b-versatile",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, messages, images, userName } = req.body;
  const nameToUse = userName || 'User';
  
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
        content: m.content
      }))
    : [{ role: 'user', content: message }];

  // Handle images and format content blocks correctly for each provider
  const lastMsg = history[history.length - 1];
  const hasImages = images && images.length > 0;

  if (hasImages && lastMsg.role === 'user') {
    const contentBlocks: any[] = [];
    
    // 1. Text block first (preferred by many vision models)
    if (typeof lastMsg.content === 'string') {
      contentBlocks.push({ type: "text", text: lastMsg.content });
    }

    // 2. Image blocks
    for (const b64 of images) {
      const parts = b64.split(',');
      if (parts.length < 2) continue;
      
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const pureBase64 = parts[1];

      if (provider === 'anthropic') {
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: mime,
            data: pureBase64
          }
        });
      } else {
        // Groq / OpenAI format
        contentBlocks.push({
          type: "image_url",
          image_url: { 
            url: b64,
            detail: "auto"
          }
        });
      }
    }

    lastMsg.content = contentBlocks;
  }

  try {
    let aiRes;
    
    if (provider === 'anthropic') {
      console.log('🤖 Routing to Anthropic Vision...');
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
          system:     `You are Aether (Neural Mesh Active), a premium AI assistant. Communicating with ${nameToUse}. Persona: Professional, precise, high-end. ${hasImages ? 'Analyze the provided images with extreme detail.' : ''} Address the user by name when starting a conversation.`,
          messages:   history,
        }),
      });
    } else {
      // Use centralized model config with .env fallback
      const groqVisionModel = process.env.GROQ_VISION_MODEL || GROQ_MODELS.VISION;
      const groqTextModel = process.env.GROQ_TEXT_MODEL || GROQ_MODELS.TEXT;
      const groqModel = hasImages ? groqVisionModel : groqTextModel;

      console.log(`🚀 Routing to Groq (${groqModel})...`);
      aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${activeKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            { role: 'system', content: `You are Aether (Neural Mesh Active), a premium AI assistant. Communicating with ${nameToUse}. Persona: Professional, precise, high-end. ${hasImages ? 'Analyze the provided images with extreme detail.' : ''} Address the user by name when starting a conversation.` },
            ...history
          ],
          temperature: 0.7,
          max_tokens: 2048
        }),
      });
    }

    const data: any = await aiRes.json();
    
    if (!aiRes.ok) {
      const rawError = (data?.error?.message || JSON.stringify(data?.error) || '').toLowerCase();
      console.error(`❌ ${provider} error [${aiRes.status}]:`, rawError);
      
      let friendlyError = "I'm having trouble connecting to my AI core right now. Please try again in a moment.";
      
      if (aiRes.status === 429) {
        friendlyError = "I'm handling a lot of requests right now. Please wait a moment and try again.";
      } else if (aiRes.status === 401 || rawError.includes('invalid api key') || rawError.includes('authentication')) {
        friendlyError = "There's a configuration issue on my end. Please contact support.";
      } else if (rawError.includes('context_length') || rawError.includes('too long')) {
        friendlyError = "Your message or file is too large for me to process. Please try a shorter message or smaller file.";
      } else if (rawError.includes('decommissioned') || rawError.includes('model_not_found') || rawError.includes('does not exist')) {
        friendlyError = "I'm experiencing a temporary model issue. Please try again.";
      }

      return res.status(200).json({ error: friendlyError });
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
