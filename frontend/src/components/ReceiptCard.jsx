import React from 'react';

function fmt(dateStr) {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

// Shows the exit receipt with a highlighted amount and all parking details
function ReceiptCard({ receipt }) {
  if (!receipt) return null;

  const amount = parseFloat(receipt.amount).toFixed(2);
  const hrs = receipt.durationHours;

  return (
    <div className="receipt" id="exit-receipt">
      {/* Top header with gradient showing amount */}
      <div className="receipt-top">
        <div>
          <div className="receipt-top-label">Parking Receipt</div>
          <div className="receipt-top-ticket">{receipt.ticketId}</div>
        </div>
        <div>
          <div className="receipt-amount">₹{amount}</div>
          <div className="receipt-amount-label">Amount Due</div>
        </div>
      </div>

      {/* Details */}
      <div className="receipt-body">
        <div className="receipt-row">
          <span className="receipt-row-label">Vehicle Number</span>
          <span className="receipt-row-value">{receipt.vehicleNumber}</span>
        </div>

        {receipt.slotNumber && (
          <div className="receipt-row">
            <span className="receipt-row-label">Slot Used</span>
            <span className="receipt-row-value">
              <span className="slot-badge">{receipt.slotNumber}</span>
            </span>
          </div>
        )}

        <div className="receipt-row">
          <span className="receipt-row-label">Entry</span>
          <span className="receipt-row-value">{fmt(receipt.entryTime)}</span>
        </div>

        <div className="receipt-row">
          <span className="receipt-row-label">Exit</span>
          <span className="receipt-row-value">{fmt(receipt.exitTime)}</span>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-row">
          <span className="receipt-row-label">Duration (rounded up)</span>
          <span className="receipt-row-value">{hrs} {hrs === 1 ? 'hour' : 'hours'}</span>
        </div>
      </div>

      <div className="receipt-total" id="receipt-total">
        <span className="receipt-total-label">Total Paid</span>
        <span className="receipt-total-value">₹{amount}</span>
      </div>
    </div>
  );
}

export default ReceiptCard;
