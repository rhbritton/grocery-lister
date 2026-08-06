'use strict';

const FREE_AI_IMPORT_LIMIT = 10;

function getProjectId() {
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.GCP_PROJECT) return process.env.GCP_PROJECT;
  if (process.env.FIREBASE_CONFIG) {
    try {
      return JSON.parse(process.env.FIREBASE_CONFIG).projectId;
    } catch {
      // ignore
    }
  }
  return 'grocerylister-b107b';
}

function profilePath(uid) {
  const projectId = getProjectId();
  return `artifacts/${projectId}/users/${uid}/profiles/${uid}`;
}

function isPaidPlan(plan) {
  // 'pro' kept for existing Stripe subscribers written before Plus rename
  return plan === 'plus' || plan === 'pro';
}

function buildUsage(data = {}) {
  const plan = isPaidPlan(data.aiImportPlan) ? 'plus' : 'free';
  const used = Math.max(0, Number(data.aiImportUsed) || 0);
  const unlimited = plan === 'plus' || data.aiImportLimit === null;
  // Free tier always uses the current product limit (ignore stale stored values).
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

module.exports = {
  FREE_AI_IMPORT_LIMIT,
  getProjectId,
  profilePath,
  buildUsage,
};
