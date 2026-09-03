import {
  FREE_AI_IMPORT_LIMIT,
  formatAiImportRemaining,
  hasSharedAiImportCredits,
  normalizeAiImportUsage,
} from './aiImportQuota';

describe('aiImportQuota', () => {
  it('defaults users to 10 remaining shared imports', () => {
    expect(normalizeAiImportUsage({})).toEqual({
      used: 0,
      limit: FREE_AI_IMPORT_LIMIT,
      remaining: FREE_AI_IMPORT_LIMIT,
      plan: 'free',
      unlimited: false,
    });
  });

  it('tracks usage against the free limit', () => {
    const usage = normalizeAiImportUsage({ aiImportUsed: 3 });
    expect(usage.remaining).toBe(7);
    expect(hasSharedAiImportCredits(usage)).toBe(true);
    expect(formatAiImportRemaining(usage)).toBe('7 of 10 free AI imports left');
  });

  it('reports no credits when the free limit is reached', () => {
    const usage = normalizeAiImportUsage({ aiImportUsed: 10 });
    expect(hasSharedAiImportCredits(usage)).toBe(false);
    expect(formatAiImportRemaining(usage)).toBe('0 of 10 free AI imports left');
  });
});
