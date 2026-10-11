export default function TicketModal({ event, user, onClose }) {
  if (!event || !user) return null;

  const formattedDate = new Date(event.date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = new Date(event.date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const passId = `EVT-${(event._id || "").slice(-6).toUpperCase()}-${(user.id || user._id || "").slice(-4).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="ticket-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="ticket-header">
          <div className="ticket-brand">
            <span>🎟️ Eventify</span>
            <span className="ticket-status-pill">Confirmed Pass</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <div className="ticket-body">
          <div className="ticket-event-info">
            <span className="ticket-category-chip">{event.category || "General"}</span>
            <h2 className="ticket-event-title">{event.title}</h2>
            <p className="ticket-event-desc">{event.description}</p>
          </div>

          <div className="ticket-divider">
            <div className="notch notch-left" />
            <div className="dashed-line" />
            <div className="notch notch-right" />
          </div>

          <div className="ticket-grid">
            <div className="ticket-item">
              <span className="ticket-label">ATTENDEE</span>
              <span className="ticket-value">{user.name}</span>
            </div>
            <div className="ticket-item">
              <span className="ticket-label">EMAIL</span>
              <span className="ticket-value">{user.email}</span>
            </div>
            <div className="ticket-item">
              <span className="ticket-label">DATE</span>
              <span className="ticket-value">{formattedDate}</span>
            </div>
            <div className="ticket-item">
              <span className="ticket-label">TIME</span>
              <span className="ticket-value">{formattedTime !== "Invalid Date" ? formattedTime : "10:00 AM"}</span>
            </div>
            <div className="ticket-item full-width">
              <span className="ticket-label">VENUE / LOCATION</span>
              <span className="ticket-value">📍 {event.venue}</span>
            </div>
            <div className="ticket-item">
              <span className="ticket-label">ORGANIZER</span>
              <span className="ticket-value">{event.organizer}</span>
            </div>
            <div className="ticket-item">
              <span className="ticket-label">PASS ID</span>
              <span className="ticket-value pass-code">{passId}</span>
            </div>
          </div>

          <div className="ticket-qr-section">
            <div className="mock-qr-code">
              <div className="qr-box">
                <div className="qr-corner top-left" />
                <div className="qr-corner top-right" />
                <div className="qr-corner bottom-left" />
                <div className="qr-bars">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
            <p className="qr-caption">Show this QR pass at the venue entrance for gate check-in</p>
          </div>
        </div>

        <div className="ticket-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={handlePrint}>
            🖨️ Print / Save Pass
          </button>
        </div>
      </div>
    </div>
  );
}
