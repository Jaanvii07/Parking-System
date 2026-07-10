// Helper to generate sequential ticket IDs (e.g. TKT-1001, TKT-1002, etc)
async function generateTicketId(db) {
  // Query to find the max ID in the tickets table
  const [rows] = await db.query('SELECT MAX(id) as maxId FROM tickets');
  const maxId = rows[0].maxId || 0;
  
  // Start numbers from 1001
  const ticketNumber = 1000 + maxId + 1;
  return `TKT-${ticketNumber}`;
}

module.exports = {
  generateTicketId
};

