import React from 'react';

/**
 * Renders a styled virtual parking ticket.
 * 
 * @param {Object} props
 * @param {Object} props.ticket - The ticket object: { ticketId, vehicleNumber, vehicleType, entryTime, slotNumber }
 */
function TicketCard({ ticket }) {
  if (!ticket) return null;

  // Format entry time for display
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="ticket" id="generated-ticket-card">
      <div className="ticket-header">
        <div className="ticket-title">PARKING TICKET</div>
        {ticket.slotNumber && (
          <div className="ticket-slot" id="ticket-slot-number">
            Slot: {ticket.slotNumber}
          </div>
        )}
      </div>

      <div className="ticket-details">
        <div className="detail-row">
          <span className="detail-label">Ticket ID</span>
          <span className="detail-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            {ticket.ticketId}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Vehicle Type</span>
          <span className="detail-value" style={{ textTransform: 'capitalize' }}>
            {ticket.vehicleType}
          </span>
        </div>

        <div className="detail-row full-width">
          <span className="detail-label">Vehicle Number</span>
          <span className="detail-value">{ticket.vehicleNumber}</span>
        </div>

        <div className="detail-row full-width">
          <span className="detail-label">Entry Time</span>
          <span className="detail-value">{formatDate(ticket.entryTime)}</span>
        </div>
      </div>

      <div className="barcode"></div>
    </div>
  );
}

export default TicketCard;
