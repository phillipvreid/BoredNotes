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

// Home shows a small stack of prompt cards, each from a different category
// so the category colors read as a collage rather than a run of one hue.
export function selectHomeCardPrompts(available: Prompt[], count = 3): Prompt[] {
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const picked: Prompt[] = [];
  const usedCategories = new Set<PromptCategory>();

  for (const prompt of shuffled) {
    if (picked.length === count) break;
    if (usedCategories.has(prompt.category)) continue;
    usedCategories.add(prompt.category);
    picked.push(prompt);
  }
  // Fewer categories than cards: top up with whatever is left.
  for (const prompt of shuffled) {
    if (picked.length === count) break;
    if (!picked.includes(prompt)) picked.push(prompt);
  }
  return picked;
}
