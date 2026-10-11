import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import TicketModal from "../components/TicketModal";

export default function MyRegistrationsPage({ notify }) {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicketEvent, setSelectedTicketEvent] = useState(null);

  const { user } = useAuth();

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await API.get("/events/my-registrations");
      setRegistrations(res.data);
    } catch (err) {
      notify("Failed to fetch your registrations.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancelRegistration = async (eventId) => {
    try {
      const res = await API.delete(`/events/${eventId}/register`);
      notify(res.data.message || "Registration cancelled successfully.", "info");
      if (selectedTicketEvent?._id === eventId) {
        setSelectedTicketEvent(null);
      }
      fetchRegistrations();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to cancel registration.", "error");
    }
  };

  // Filtered registrations based on search query
  const filteredRegistrations = useMemo(() => {
    if (!searchQuery.trim()) return registrations;
    const query = searchQuery.toLowerCase();
    return registrations.filter(
      (ev) =>
        ev.title?.toLowerCase().includes(query) ||
        ev.venue?.toLowerCase().includes(query) ||
        ev.organizer?.toLowerCase().includes(query)
    );
  }, [registrations, searchQuery]);

  // Compute attendee metrics
  const now = new Date();
  const upcomingEvents = registrations.filter((ev) => new Date(ev.date) >= now);
  const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">My Registered Events</h2>
          <p className="section-subtitle">
            Manage your booked passes, print entry tickets, or cancel reservations
          </p>
        </div>
        <div className="header-actions-row">
          <button
            className="refresh-btn"
            onClick={fetchRegistrations}
            title="Refresh tickets"
          >
            🔄 Sync
          </button>
          <span className="event-count-badge">
            {registrations.length} {registrations.length === 1 ? "Ticket" : "Tickets"}
          </span>
        </div>
      </div>

      {/* Attendee Metrics Banner */}
      {!loading && registrations.length > 0 && (
        <div className="registration-stats-grid">
          <div className="reg-stat-card">
            <span className="stat-icon">🎟️</span>
            <div>
              <div className="stat-number">{registrations.length}</div>
              <div className="stat-label">Total Passes Reserved</div>
            </div>
          </div>
          <div className="reg-stat-card">
            <span className="stat-icon">📅</span>
            <div>
              <div className="stat-number">{upcomingEvents.length}</div>
              <div className="stat-label">Upcoming Events</div>
            </div>
          </div>
          <div className="reg-stat-card">
            <span className="stat-icon">📍</span>
            <div>
              <div className="stat-number">
                {nextEvent
                  ? new Date(nextEvent.date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })
                  : "None"}
              </div>
              <div className="stat-label">
                {nextEvent ? `Next: ${nextEvent.title.slice(0, 20)}...` : "No upcoming events"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Filter for Booked Tickets */}
      {!loading && registrations.length > 1 && (
        <div className="registration-search-bar">
          <input
            type="text"
            placeholder="Search your registered events by title, venue, or organizer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="state-box">
          <div className="spinner" />
          <p>Loading your event passes...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="state-box empty">
          <div className="empty-icon">🎟️</div>
          <h3>No Event Registrations Yet</h3>
          <p>
            You haven't reserved tickets for any events yet. Discover upcoming hackathons,
            workshops, and symposiums!
          </p>
          <Link to="/" className="btn-primary mt-4">
            Explore Upcoming Events →
          </Link>
        </div>
      ) : filteredRegistrations.length === 0 ? (
        <div className="state-box empty">
          <div className="empty-icon">🔍</div>
          <h3>No matching tickets</h3>
          <p>No registered events match "{searchQuery}". Try a different keyword.</p>
          <button className="btn-secondary mt-4" onClick={() => setSearchQuery("")}>
            Clear Search
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {filteredRegistrations.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              onCancelRegistration={handleCancelRegistration}
              onViewTicket={(ev) => setSelectedTicketEvent(ev)}
            />
          ))}
        </div>
      )}

      {/* Digital Ticket Modal */}
      {selectedTicketEvent && (
        <TicketModal
          event={selectedTicketEvent}
          user={user}
          onClose={() => setSelectedTicketEvent(null)}
        />
      )}
    </div>
  );
}

