// KNOWLEDGE BASE REPORTS

export async function knowledgeMostViewedReport({ db }) {
  return db.query(`
    SELECT title AS label, views AS value
    FROM knowledge_article
    ORDER BY views DESC
    LIMIT 10
  `);
}

export async function knowledgeByStatusReport({ db }) {
  return db.query(`
    SELECT status AS label, COUNT(*)::integer AS value
    FROM knowledge_article
    GROUP BY status
  `);
}

export async function knowledgeBySpaceReport({ db }) {
  return db.query(`
    SELECT s.name AS label, COUNT(a.id)::integer AS value
    FROM knowledge_space s
    LEFT JOIN knowledge_article a ON a."spaceId" = s.id
    GROUP BY s.id, s.name
    ORDER BY value DESC
  `);
}
