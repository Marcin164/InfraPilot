// NETWORK DEVICE REPORTS

export async function networkBackupStatusReport({ db }) {
  return db.query(`
    WITH latest AS (
      SELECT DISTINCT ON ("deviceId") "deviceId", success
      FROM network_device_config_backup
      ORDER BY "deviceId", "createdAt" DESC
    )
    SELECT 'ok' AS label, COUNT(*) FILTER (WHERE success)::integer AS value FROM latest
    UNION ALL
    SELECT 'failed' AS label, COUNT(*) FILTER (WHERE NOT success)::integer AS value FROM latest
  `);
}
