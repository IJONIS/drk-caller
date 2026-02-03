import { kv } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_CONFIG = {
  agentName: 'Sarah',
  donorName: 'Max Mustermann',
  currentAmount: 20,
  targetAmount: 35,
  donationHistory: '2 Jahre',
  contactTone: 'Friendly',
  additionalInstructions: '',
  systemPrompt: '',
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = await kv.get('red-cross-caller:prompt-config');

    if (!config) {
      return res.status(200).json(DEFAULT_CONFIG);
    }

    // Merge with defaults to handle new fields
    return res.status(200).json({ ...DEFAULT_CONFIG, ...config });
  } catch (error) {
    console.error('Error fetching config:', error);
    return res.status(500).json({ error: 'Failed to fetch configuration' });
  }
}
