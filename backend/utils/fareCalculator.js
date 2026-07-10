// Helper function to calculate duration and parking charge based on entry and exit time
// Charges rules:
// - 1 to 3 Hours: Rs. 30
// - 4 to 6 Hours: Rs. 85
// - 7+ Hours: Rs. 120
// Note: Duration is rounded UP to the nearest hour (e.g. 1.2 hours = 2 hours)
function calculateFare(entryTime, exitTime) {
  const entryDate = new Date(entryTime);
  const exitDate = new Date(exitTime);

  // Validate dates
  if (isNaN(entryDate.getTime()) || isNaN(exitDate.getTime())) {
    throw new Error('Invalid dates provided for fare calculation');
  }

  const timeDiffMs = exitDate.getTime() - entryDate.getTime();
  if (timeDiffMs < 0) {
    throw new Error('Exit time cannot be before entry time!');
  }

  // Convert milliseconds to hours
  const hours = timeDiffMs / (1000 * 60 * 60);
  
  // Round up to next hour (min 1 hour)
  const durationHours = Math.max(1, Math.ceil(hours));

  // Determine amount based on slabs
  let amount = 0;
  if (durationHours <= 3) {
    amount = 30;
  } else if (durationHours <= 6) {
    amount = 85;
  } else {
    amount = 120;
  }

  return {
    durationHours,
    amount
  };
}

module.exports = {
  calculateFare
};

