/**
 * Calculates the parking duration and fare based on entry and exit times.
 * Pricing Tiers:
 * - 1-3 Hours: ₹30
 * - 4-6 Hours: ₹85
 * - 7+ Hours:  ₹120
 * 
 * Duration is rounded UP to the next integer hour.
 * 
 * @param {Date|string} entryTime - The entry timestamp.
 * @param {Date|string} exitTime - The exit timestamp.
 * @returns {Object} An object containing durationHours and amount.
 */
function calculateFare(entryTime, exitTime) {
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);

  if (isNaN(entry.getTime()) || isNaN(exit.getTime())) {
    throw new Error('Invalid entry or exit timestamp.');
  }

  const diffMs = exit.getTime() - entry.getTime();
  if (diffMs < 0) {
    throw new Error('Exit time cannot be before entry time.');
  }

  // Convert milliseconds to hours
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Round up duration. If it's 0 (exact same instant), charge minimum 1 hour.
  const durationHours = Math.max(1, Math.ceil(diffHours));

  let amount = 0;
  if (durationHours >= 1 && durationHours <= 3) {
    amount = 30;
  } else if (durationHours >= 4 && durationHours <= 6) {
    amount = 85;
  } else if (durationHours >= 7) {
    amount = 120;
  }

  return {
    durationHours,
    amount,
  };
}

module.exports = {
  calculateFare,
};
