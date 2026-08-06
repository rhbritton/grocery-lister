export const FREE_AI_IMPORT_LIMIT = 10;

function isPaidPlan(plan) {
  // 'pro' kept for existing Stripe subscribers written before Plus rename
  return plan === 'plus' || plan === 'pro';
}

export function normalizeAiImportUsage(data = {}) {
  const plan = isPaidPlan(data.aiImportPlan) ? 'plus' : 'free';
  const used = Math.max(0, Number(data.aiImportUsed) || 0);
  const unlimited = plan === 'plus' || data.aiImportLimit === null;
  // Free tier always uses the current product limit (ignore stale stored 15, etc.)
  const limit = unlimited ? null : FREE_AI_IMPORT_LIMIT;
  const remaining = limit == null ? null : Math.max(0, limit - used);

  return {
    used,
    limit,
    remaining,
    plan,
    unlimited: limit == null,
  };
}

export function formatAiImportRemaining(usage) {
  if (!usage) return '';
  if (usage.unlimited || usage.limit == null) {
    return 'Unlimited shared AI imports';
  }
  const left = usage.remaining ?? 0;
  return `${left} of ${usage.limit} free AI imports left`;
}

export function hasSharedAiImportCredits(usage) {
  if (!usage) return true;
  if (usage.unlimited || usage.limit == null) return true;
  return (usage.remaining ?? 0) > 0;
}
