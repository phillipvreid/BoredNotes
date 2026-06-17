import type { PromptCategory, PromptModifiers } from '../types';
import type { PromptContext } from '../context/types';

export interface AiPromptInput {
  category: PromptCategory;
  depth: 1 | 2 | 3;
  recentTopics: string[];
  context?: PromptContext;
  modifiers?: Pick<PromptModifiers, 'time' | 'place' | 'weather'>;
}

const TIMEOUT_MS = 2000;
const DEFAULT_CONTEXT_MODIFIERS: Pick<PromptModifiers, 'time' | 'place' | 'weather'> = {
  time: true,
  place: true,
  weather: true,
};

function buildContextLine(
  ctx: PromptContext,
  modifiers: Pick<PromptModifiers, 'time' | 'place' | 'weather'>
): string {
  const hasWeather = modifiers.weather && !!ctx.weatherCondition && ctx.temperatureCelsius !== null;
  const hasPlace = modifiers.place && !!ctx.locationLabel;
  const hasTime = modifiers.time;

  if (!hasWeather && !hasPlace && !hasTime) return '';

  if (hasTime && hasPlace && hasWeather) {
    return `It's a ${ctx.weatherCondition} ${ctx.dayOfWeek} ${ctx.timeOfDay} in ${ctx.locationLabel}, ${ctx.temperatureCelsius}°C.`;
  }
  if (hasTime && hasPlace) {
    return `It's a ${ctx.dayOfWeek} ${ctx.timeOfDay} in ${ctx.locationLabel}.`;
  }
  if (hasTime && hasWeather) {
    return `It's a ${ctx.weatherCondition} ${ctx.dayOfWeek} ${ctx.timeOfDay} in ${ctx.season}, ${ctx.temperatureCelsius}°C.`;
  }
  if (hasTime) {
    return `It's a ${ctx.dayOfWeek} ${ctx.timeOfDay} in ${ctx.season}.`;
  }
  if (hasPlace && hasWeather) {
    return `It's ${ctx.weatherCondition} in ${ctx.locationLabel}, ${ctx.temperatureCelsius}°C.`;
  }
  if (hasPlace) {
    return `The user is currently in ${ctx.locationLabel}.`;
  }
  return `It's ${ctx.weatherCondition}, ${ctx.temperatureCelsius}°C.`;
}

export async function generateAiPrompt(
  input: AiPromptInput,
  apiKey: string
): Promise<string | null> {
  const depthLabel = ['light and quick', 'moderately thoughtful', 'deep and personal'][input.depth - 1];
  const topicsLine = input.recentTopics.length > 0
    ? `Recent topics the user has responded to: ${input.recentTopics.join(', ')}.`
    : '';
  const modifiers = input.modifiers ?? DEFAULT_CONTEXT_MODIFIERS;
  const contextLine = input.context ? buildContextLine(input.context, modifiers) : '';
  const steeringLine = contextLine
    ? " Don't force every detail into one short question — only use what makes it feel timely or personal."
    : '';

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [{
      role: 'user',
      content: `${contextLine ? contextLine + ' ' : ''}Generate one ${depthLabel} journaling prompt in the "${input.category}" category.${steeringLine} ${topicsLine} The prompt should be a single question, under 20 words, written in second person. Return only the prompt text, no quotes, no explanation.`,
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
