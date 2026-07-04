// LICENSE REPORTS

export async function licensesExpiringSoonReport({ db }) {
  return db.query(`
    SELECT 'expiringSoon' AS label, COUNT(*)::integer AS value
    FROM software_license
    WHERE "expiresAt" IS NOT NULL
      AND "expiresAt" >= CURRENT_DATE
      AND "expiresAt" <= CURRENT_DATE + INTERVAL '30 days'
    UNION ALL
    SELECT 'activeTotal' AS label, COUNT(*)::integer AS value
    FROM software_license
    WHERE "expiresAt" IS NULL OR "expiresAt" >= CURRENT_DATE
  `);
}

export async function licenseSeatUtilizationReport({ db }) {
  return db.query(`
    SELECT l.name AS label,
           COUNT(a.id)::integer AS value,
           l."totalSeats" AS total
    FROM software_license l
    LEFT JOIN software_license_assignment a ON a."licenseId" = l.id
    WHERE l."totalSeats" IS NOT NULL AND l."totalSeats" > 0
    GROUP BY l.id, l.name, l."totalSeats"
    ORDER BY (COUNT(a.id)::float / NULLIF(l."totalSeats", 0)) DESC
    LIMIT 8
  `);
}
