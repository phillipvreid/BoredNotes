import type { PromptCategory } from '../types';

export interface AiPromptInput {
  category: PromptCategory;
  depth: 1 | 2 | 3;
  recentTopics: string[];
}

const TIMEOUT_MS = 2000;

export async function generateAiPrompt(
  input: AiPromptInput,
  apiKey: string
): Promise<string | null> {
  const depthLabel = ['light and quick', 'moderately thoughtful', 'deep and personal'][input.depth - 1];
  const topicsLine = input.recentTopics.length > 0
    ? `Recent topics the user has responded to: ${input.recentTopics.join(', ')}.`
    : '';

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [{
      role: 'user',
      content: `Generate one ${depthLabel} journaling prompt in the "${input.category}" category. ${topicsLine} The prompt should be a single question, under 20 words, written in second person. Return only the prompt text, no quotes, no explanation.`,
    }],
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body,
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.content?.[0]?.text?.trim() ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
