// PROCUREMENT REPORTS

export async function procurementPipelineReport({ db }) {
  return db.query(`
    SELECT status AS label, COUNT(*)::integer AS value
    FROM purchase_order
    WHERE status != 'cancelled'
    GROUP BY status
  `);
}
