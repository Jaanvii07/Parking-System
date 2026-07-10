import React from 'react';

// Formats a date string for readable display
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

function TicketCard({ ticket }) {
  if (!ticket) return null;

  return (
    <div className="ticket" id="generated-ticket">
      <div className="ticket-header">
        <div className="ticket-title">🎫 Parking Ticket Issued</div>
        {ticket.slotNumber && (
          <div className="ticket-slot" id="ticket-slot">{ticket.slotNumber}</div>
        )}
      </div>

      <div className="ticket-details">
        <div className="ticket-field">
          <span className="ticket-field-label">Ticket ID</span>
          <span className="ticket-field-value ticket-id-value">{ticket.ticketId}</span>
        </div>

        <div className="ticket-field">
          <span className="ticket-field-label">Vehicle Type</span>
          <span className="ticket-field-value" style={{ textTransform: 'capitalize' }}>
            {ticket.vehicleType}
          </span>
        </div>

        <div className="ticket-field full">
          <span className="ticket-field-label">Vehicle Number</span>
          <span className="ticket-field-value">{ticket.vehicleNumber}</span>
        </div>

        <div className="ticket-field full">
          <span className="ticket-field-label">Entry Time</span>
          <span className="ticket-field-value">{fmt(ticket.entryTime)}</span>
        </div>
      </div>

      <div className="barcode"></div>
    </div>
  );
}

export default TicketCard;
