import type { PromptCategory, PromptModifiers } from '../types';
import type { PromptContext } from '../context/types';

export interface AiPromptInput {
  // Homescreen/contextual prompts pass a category to stay within the library's
  // taxonomy. Help Me Write omits it — those prompts are chip-driven instead
  // (see buildTopicInstruction) and shouldn't be tied to observe/reflect/etc.
  category?: PromptCategory;
  depth: 1 | 2 | 3;
  recentTopics: string[];
  context?: PromptContext;
  modifiers?: PromptModifiers;
}

const TIMEOUT_MS = 2000;
const DEFAULT_CONTEXT_MODIFIERS: PromptModifiers = {
  time: true,
  place: true,
  weather: true,
  memory: true,
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

// Help Me Write has no homescreen category to anchor to — the active chips
// are the only signal for what the prompt should actually be about, so each
// one gets a concrete angle (with an example) rather than a vague topic name.
// The place angle is deliberately forceful: it must produce a place-specific
// question, naming the user's actual location when we have it.
function buildTopicInstruction(modifiers: PromptModifiers, context?: PromptContext): string {
  const angles: string[] = [];
  if (modifiers.place) {
    const loc = context?.locationLabel;
    angles.push(
      loc
        ? `a specific place — it MUST be about a place, never abstract. Either ask about where they are right now (${loc}) by name, or ask them to name and talk about a favorite spot. Keep it concrete and place-specific, e.g. "What's your favorite bar in ${loc}?" or "What's the best-kept secret of ${loc}?"`
        : `a specific place — it MUST be about a place, never abstract. Ask them to name and talk about a favorite spot: a bar, a park, a café, a neighborhood. Keep it concrete, e.g. "What's your favorite bar in your city?" or "What's a place near you that never gets old?"`
    );
  }
  if (modifiers.weather) {
    angles.push(
      'the weather right now and how it\'s nudging their mood, plans, or energy'
    );
  }
  if (modifiers.time) {
    angles.push(
      'this specific time of day, day of week, or season, and what that stretch of time usually means for them'
    );
  }
  if (modifiers.memory) {
    angles.push(
      'something they touched on recently, inviting them to go further without just repeating it'
    );
  }

  if (angles.length === 0) {
    return 'a broad, low-stakes writing spark — something anyone could answer regardless of time, place, or mood, meant purely to get them writing something, anything';
  }
  return angles.join('; and ');
}

export async function generateAiPrompt(
  input: AiPromptInput,
  apiKey: string
): Promise<string | null> {
  const DEPTH_VOICE = [
    'Snarky, smug, and silly. Ask a real question, then add a short deadpan jab. No emoji, no exclamation marks. Example register: "Sniff the air. Report your findings. Be brave."',
    'A sincere question with one dry tag-on quip that lowers the stakes. Example register: "What\'s something you\'re pretending is fine? It can hear you."',
    'Sincere and direct with a dry undertone. No jokes, no sentimentality — like a deadpan friend asking for real.',
  ] as const;
  const voiceInstruction = DEPTH_VOICE[input.depth - 1];
  const DEPTH_REGISTER = ['light and quick', 'moderately thoughtful', 'deep and personal'] as const;
  const registerLabel = DEPTH_REGISTER[input.depth - 1];
  const topicsLine = input.recentTopics.length > 0
    ? `Recent topics the user has responded to: ${input.recentTopics.join(', ')}.`
    : '';
  const modifiers = input.modifiers ?? DEFAULT_CONTEXT_MODIFIERS;
  const contextLine = input.context ? buildContextLine(input.context, modifiers) : '';
  const steeringLine = contextLine
    ? " Don't force every detail into one short question — only use what makes it feel timely or personal."
    : '';

  const topicInstruction = input.category
    ? `in the "${input.category}" category`
    : `about ${buildTopicInstruction(modifiers, input.context)}`;

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 80,
    messages: [{
      role: 'user',
      content: `${contextLine ? contextLine + ' ' : ''}Generate one ${registerLabel} journaling prompt ${topicInstruction}. Voice: ${voiceInstruction}${steeringLine} ${topicsLine} The prompt should be a single question, under 20 words, written in second person. Return only the prompt text, no quotes, no explanation.`,
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
