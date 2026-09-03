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

function buildUsage(data = {}) {
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

module.exports = {
  FREE_AI_IMPORT_LIMIT,
  getProjectId,
  profilePath,
  buildUsage,
};
