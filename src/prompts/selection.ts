import type { Prompt, PromptCategory } from '../types';

export function selectPrompt(
  available: Prompt[],
  recentCategories: PromptCategory[],
  recentDepths: number[]
): Prompt {
  if (available.length === 0) throw new Error('No prompts available');

  const lastTwoCategories = recentCategories.slice(-2);
  const lastThreeDepths = recentDepths.slice(-3);
  const forbiddenDepth =
    lastThreeDepths.length === 3 && lastThreeDepths.every(d => d === lastThreeDepths[0])
      ? lastThreeDepths[0]
      : null;

  let candidates = available.filter(p => {
    if (lastTwoCategories.includes(p.category)) return false;
    if (forbiddenDepth !== null && p.depth === forbiddenDepth) return false;
    return true;
  });

  if (candidates.length === 0) candidates = available;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
