import {
  FREE_AI_IMPORT_LIMIT,
  formatAiImportRemaining,
  hasSharedAiImportCredits,
  normalizeAiImportUsage,
} from './aiImportQuota';

describe('aiImportQuota', () => {
  it('defaults free users to 10 remaining', () => {
    expect(normalizeAiImportUsage({})).toEqual({
      used: 0,
      limit: FREE_AI_IMPORT_LIMIT,
      remaining: FREE_AI_IMPORT_LIMIT,
      plan: 'free',
      unlimited: false,
    });
  });

  it('treats plus (and legacy pro) as unlimited', () => {
    const plus = normalizeAiImportUsage({ aiImportPlan: 'plus', aiImportUsed: 99 });
    expect(plus.unlimited).toBe(true);
    expect(plus.plan).toBe('plus');
    expect(plus.remaining).toBeNull();
    expect(hasSharedAiImportCredits(plus)).toBe(true);
    expect(formatAiImportRemaining(plus)).toMatch(/Unlimited/i);

    const legacyPro = normalizeAiImportUsage({ aiImportPlan: 'pro', aiImportUsed: 99 });
    expect(legacyPro.unlimited).toBe(true);
    expect(legacyPro.plan).toBe('plus');
  });

  it('formats remaining for free tier', () => {
    const usage = normalizeAiImportUsage({ aiImportUsed: 3 });
    expect(formatAiImportRemaining(usage)).toBe('7 of 10 free AI imports left');
    expect(hasSharedAiImportCredits(normalizeAiImportUsage({ aiImportUsed: 10 }))).toBe(false);
  });
});
