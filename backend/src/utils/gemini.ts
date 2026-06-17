const BASE_URL = 'https://gemini.googleapis.com/v1/models';
const DEFAULT_MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-pro';
const GEMINI_ENDPOINTS = [':generateText', ':generate', ':predict'];

export async function invokeGemini(prompt: string, model = DEFAULT_MODEL): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const accessToken = process.env.GOOGLE_ACCESS_TOKEN;

  if (!apiKey && !accessToken) {
    throw new Error('Gemini API credentials not configured. Set GOOGLE_API_KEY or GOOGLE_ACCESS_TOKEN.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const payload = {
    prompt: {
      messages: [
        {
          author: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    },
    temperature: 0.2,
    maxOutputTokens: 512,
    candidateCount: 1,
  };

  let lastError: Error | null = null;

  for (const endpoint of GEMINI_ENDPOINTS) {
    const url = `${BASE_URL}/${encodeURIComponent(model)}${endpoint}${apiKey ? `?key=${encodeURIComponent(apiKey)}` : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const json = (await response.json().catch((err) => {
        throw new Error(`Invalid Gemini response: ${err}`);
      })) as any;

      const candidates = json?.candidates;
      const rawText = Array.isArray(candidates)
        ? candidates
            .map((candidate: any) => {
              const content = candidate?.output?.content;
              if (!Array.isArray(content)) return '';
              return content.map((piece: any) => piece?.text || '').join('');
            })
            .join('\n')
        : '';

      if (rawText) {
        return rawText.trim();
      }

      const fallbackText = json?.output?.content?.map((piece: any) => piece?.text || '').join('');
      if (fallbackText) {
        return fallbackText.trim();
      }

      throw new Error('Gemini returned no text output');
    }

    const errorBody = await response.text();
    lastError = new Error(`Gemini API error ${response.status} on endpoint ${endpoint}: ${errorBody}`);
    if (response.status !== 404 && response.status !== 405) {
      break;
    }
  }

  throw lastError || new Error('Gemini API failed on all attempted endpoints');
}
