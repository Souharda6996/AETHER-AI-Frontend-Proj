import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import { GROQ_MODELS } from '../config/models'

dotenv.config()

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

app.post('/api/chat', async (req, res) => {
  const { message, messages, images } = req.body
  
  // 1. Try Anthropic first
  let apiKey = process.env.ANTHROPIC_API_KEY
  const isAnthropicTokenValid = apiKey && !apiKey.includes('YOUR-KEY-HERE')

  // 2. Fallback to Groq if Anthropic is placeholder or missing
  const groqKey = process.env.VITE_API_KEY || process.env.GROQ_API_KEY
  
  let provider = isAnthropicTokenValid ? 'anthropic' : (groqKey ? 'groq' : null)
  let activeKey = isAnthropicTokenValid ? apiKey : groqKey

  if (!provider || !activeKey) {
    console.error('❌ No valid API key found (Anthropic or Groq)')
    return res.status(500).json({ 
      error: 'API Configuration Error: Please paste your Anthropic or Groq key in the .env file.' 
    })
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
          'x-api-key':         activeKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:      'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          system:     'You are AetherAI, a premium assistant with advanced computer vision capabilities. Analyze the provided images carefully and provide detailed insights.',
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
            { role: 'system', content: 'You are AetherAI, a premium assistant with advanced vision capabilities. You can see and analyze images perfectly. When an image is provided, respond based on what you see in the image.' },
            ...history
          ],
          temperature: 0.7,
          max_tokens: 2048
        }),
      });
    }

    const data: any = await aiRes.json()
    
    if (!aiRes.ok) {
      console.error(`❌ ${provider} error:`, data?.error?.message || data?.error || 'Unknown error')
      
      // Enhanced Error Handling for Users
      let friendlyError = 'An error occurred while processing your request. Please try again.';
      const rawError = (data?.error?.message || JSON.stringify(data?.error) || '').toLowerCase();
      
      if (rawError.includes('decommissioned') || rawError.includes('not found') || rawError.includes('model_not_found')) {
        friendlyError = 'The selected AI model is currently undergoing maintenance. Our engineers have been notified. Please try again in a few minutes.';
      } else if (aiRes.status === 429) {
        friendlyError = 'Too many requests. Please wait a moment and try again.';
      } else if (rawError.includes('api key') || rawError.includes('authentication')) {
        friendlyError = 'Authentication error. Please check your API configuration.';
      }

      return res.status(aiRes.status).json({ error: friendlyError });
    }

    let reply = ''
    if (provider === 'anthropic') {
      reply = data?.content?.[0]?.text
    } else {
      reply = data?.choices?.[0]?.message?.content
    }

    if (!reply?.trim()) {
      return res.status(500).json({ error: 'Empty AI response' })
    }

    console.log(`✅ ${provider} success`)
    res.json({ reply })

  } catch (err: any) {
    console.error('❌ Server error:', err)
    res.status(500).json({ error: 'Internal Server Error. Please try again later.' })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`✅ API server running on port ${PORT}`))
