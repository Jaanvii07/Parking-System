import React from 'react';

/**
 * Renders a structured receipt for a vehicle that has exited.
 * 
 * @param {Object} props
 * @param {Object} props.receipt - Receipt data: { ticketId, vehicleNumber, entryTime, exitTime, durationHours, amount, slotNumber }
 */
function ReceiptCard({ receipt }) {
  if (!receipt) return null;

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="receipt" id="exit-receipt-card">
      <div className="receipt-header">
        <div className="receipt-detail-row" style={{ flexDirection: 'column', gap: '0.25rem' }}>
          <span className="receipt-title">PARKING RECEIPT</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ID: {receipt.ticketId}
          </span>
        </div>
        <div className="receipt-amount-highlight" id="receipt-amount">
          ₹{parseFloat(receipt.amount).toFixed(2)}
        </div>
      </div>

      <div className="receipt-details-list">
        <div className="receipt-detail-row">
          <span>Vehicle Number:</span>
          <span>{receipt.vehicleNumber}</span>
        </div>

        {receipt.slotNumber && (
          <div className="receipt-detail-row">
            <span>Assigned Slot:</span>
            <span className="slot-badge">{receipt.slotNumber}</span>
          </div>
        )}

        <div className="receipt-detail-row">
          <span>Entry Time:</span>
          <span>{formatDate(receipt.entryTime)}</span>
        </div>

        <div className="receipt-detail-row">
          <span>Exit Time:</span>
          <span>{formatDate(receipt.exitTime)}</span>
        </div>

        <div className="receipt-detail-row">
          <span>Duration (Rounded Up):</span>
          <span>
            {receipt.durationHours} {receipt.durationHours === 1 ? 'Hour' : 'Hours'}
          </span>
        </div>

        <div className="receipt-detail-row total">
          <span>Amount Paid:</span>
          <span>₹{parseFloat(receipt.amount).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

export default ReceiptCard;
