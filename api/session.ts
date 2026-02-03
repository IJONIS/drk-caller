import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * POST /api/session
 * Creates an ephemeral client secret for WebRTC Realtime API connections.
 * The secret is short-lived and safe to pass to the browser.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { voice, instructions } = req.body || {};

    const response = await fetch(
      'https://api.openai.com/v1/realtime/sessions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview',
          voice: voice || 'coral',
          instructions: instructions || '',
          modalities: ['audio', 'text'],
          input_audio_transcription: {
            model: 'gpt-4o-mini-transcribe',
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.6,
            prefix_padding_ms: 400,
            silence_duration_ms: 1200,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI session error:', errorText);
      return res.status(response.status).json({
        error: 'Failed to create session',
        details: errorText,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
}
