// RETENTION & LEGAL HOLD REPORTS

export async function retentionLegalHoldReport({ db }) {
  return db.query(`
    SELECT 'legalHoldsActive' AS label, COUNT(*)::integer AS value
    FROM legal_hold WHERE "releasedAt" IS NULL
    UNION ALL
    SELECT 'policiesNeverRun' AS label, COUNT(*)::integer AS value
    FROM retention_policy WHERE enabled = true AND "lastRunAt" IS NULL
    UNION ALL
    SELECT 'lastRunAffected' AS label, COALESCE(SUM("lastRunAffected"), 0)::integer AS value
    FROM retention_policy WHERE "lastRunAt" IS NOT NULL
  `);
}
