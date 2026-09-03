export const FREE_AI_IMPORT_LIMIT = 10;

export function normalizeAiImportUsage(data = {}) {
  const used = Math.max(0, Number(data.aiImportUsed) || 0);
  const limit = FREE_AI_IMPORT_LIMIT;
  const remaining = Math.max(0, limit - used);

  return {
    used,
    limit,
    remaining,
    plan: 'free',
    unlimited: false,
  };
}

export function formatAiImportRemaining(usage) {
  if (!usage) return '';
  const left = usage.remaining ?? 0;
  return `${left} of ${usage.limit} free AI imports left`;
}

export function hasSharedAiImportCredits(usage) {
  if (!usage) return true;
  return (usage.remaining ?? 0) > 0;
}
