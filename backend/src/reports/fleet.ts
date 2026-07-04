// FLEET HEALTH REPORTS

/** Mirrors FleetService.staleAgentsCount()'s default 168h (7 day) threshold. */
export async function staleAgentsReport({ db }) {
  return db.query(`
    SELECT 'staleAgents' AS label, COUNT(*)::integer AS value
    FROM devices
    WHERE ("lastScanAt" IS NULL OR "lastScanAt" < NOW() - INTERVAL '168 hours')
      AND lifecycle NOT IN ('retired', 'disposed', 'lost')
  `);
}
