import { useAuth } from "../context/AuthContext";

export default function EventCard({
  event,
  onRegister,
  onCancelRegistration,
  onViewTicket,
  onEdit,
  onDelete,
}) {
  const { user, isAdmin } = useAuth();

  const formattedDate = new Date(event.date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const registeredCount = event.registeredUsers?.length || 0;
  const seatsLeft = Math.max(0, event.capacity - registeredCount);
  const isFull = seatsLeft === 0;
  const isLowCapacity = !isFull && seatsLeft <= 5;

  const isUserRegistered =
    user &&
    event.registeredUsers?.some((u) => {
      const regId = typeof u === "string" ? u : u?._id;
      return regId?.toString() === (user.id || user._id)?.toString();
    });

  const handleCancelClick = () => {
    if (window.confirm(`Are you sure you want to cancel your registration for "${event.title}"?`)) {
      onCancelRegistration(event._id);
    }
  };

  return (
    <article className="event-card">
      <div className="event-card-header">
        <div className="header-chips-left">
          <span
            className={`event-badge ${
              isFull ? "badge-full" : isLowCapacity ? "badge-urgent" : ""
            }`}
          >
            {isFull ? "Housefull" : isLowCapacity ? `🔥 Only ${seatsLeft} left` : `${seatsLeft} seats left`}
          </span>
          {event.category && (
            <span className="category-chip">{event.category}</span>
          )}
        </div>
        <div className="header-chips-right">
          <span className="price-chip">
            {event.price && event.price > 0 ? `₹${event.price}` : "Free"}
          </span>
          <span className="event-date-chip">{formattedDate}</span>
        </div>
      </div>

      <div className="event-card-body">
        <h3 className="event-title">{event.title}</h3>
        <p className="event-desc">{event.description}</p>

        <div className="event-meta">
          <div className="meta-item">
            <span className="meta-icon">📍</span>
            <span>{event.venue}</span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">👤</span>
            <span>Organized by <strong>{event.organizer}</strong></span>
          </div>
          <div className="meta-item">
            <span className="meta-icon">🎟️</span>
            <span>
              Capacity: <strong>{registeredCount} / {event.capacity}</strong>
            </span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="capacity-bar-container">
          <div
            className={`capacity-bar ${isFull ? "full" : isLowCapacity ? "urgent" : ""}`}
            style={{
              width: `${Math.min(100, (registeredCount / event.capacity) * 100)}%`,
            }}
          />
        </div>
      </div>

      <div className="event-card-actions">
        {isAdmin ? (
          <div className="admin-actions">
            <button
              className="action-btn edit-btn"
              onClick={() => onEdit(event)}
            >
              ✏️ Edit
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => onDelete(event._id)}
            >
              🗑️ Delete
            </button>
          </div>
        ) : isUserRegistered ? (
          <div className="user-registered-actions">
            <span className="registered-badge">✓ Registered</span>
            {onViewTicket && (
              <button
                className="view-ticket-btn"
                onClick={() => onViewTicket(event)}
                title="View digital event ticket"
              >
                🎟️ View Ticket
              </button>
            )}
            {onCancelRegistration && (
              <button
                className="cancel-reg-btn"
                onClick={handleCancelClick}
                title="Cancel your registration"
              >
                Cancel Pass
              </button>
            )}
          </div>
        ) : (
          <button
            className={`action-btn register-btn ${isFull ? "disabled" : ""}`}
            disabled={isFull}
            onClick={() => onRegister(event._id)}
          >
            {isFull ? "Sold Out" : "Register Now"}
          </button>
        )}
      </div>
    </article>
  );
}

