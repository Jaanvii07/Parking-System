/**
 * Generates the next sequential ticket ID.
 * Example format: TKT-1001, TKT-1002, etc.
 * @param {Object} db - The database connection or pool.
 * @returns {Promise<string>} The generated ticket ID.
 */
async function generateTicketId(db) {
  const [rows] = await db.query('SELECT MAX(id) as maxId FROM tickets');
  const maxId = rows[0].maxId || 0;
  const nextId = maxId + 1;
  
  // Start from TKT-1001
  const ticketNumber = 1000 + nextId;
  return `TKT-${ticketNumber}`;
}

module.exports = {
  generateTicketId,
};
