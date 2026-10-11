import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/EventCard";
import TicketModal from "../components/TicketModal";

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIES = ["Technical", "Cultural", "Workshop", "Hackathon", "Seminar", "Sports", "Other"];

const SORT_OPTIONS = [
  { value: "date_asc",      label: "📅 Date: Soonest First" },
  { value: "date_desc",     label: "📅 Date: Latest First" },
  { value: "title_asc",     label: "🔤 Title: A → Z" },
  { value: "capacity_desc", label: "🎟️ Capacity: Largest" },
  { value: "capacity_asc",  label: "🎟️ Capacity: Smallest" },
];

// ── Skeleton Card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="event-card skeleton-card" aria-hidden="true">
      <div className="skeleton-card-header" />
      <div className="event-card-body">
        <div className="skeleton-title" />
        <div className="skeleton-line sk-w-full" />
        <div className="skeleton-line sk-w-3q" />
        <div className="skeleton-line sk-w-half" style={{ marginTop: "16px" }} />
        <div className="skeleton-line sk-w-3q" />
      </div>
      <div className="skeleton-footer" />
    </div>
  );
}

// ── Active filter chips helper ─────────────────────────────────────────────────
function FilterChip({ label, onRemove }) {
  return (
    <span className="active-filter-chip">
      {label}
      <button className="chip-remove-btn" onClick={onRemove} aria-label={`Remove ${label} filter`}>
        ✕
      </button>
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function EventsPage({ notify }) {
  const [events, setEvents]             = useState([]);
  const [search, setSearch]             = useState("");
  const [selectedVenue, setSelectedVenue]       = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus]     = useState("");
  const [sortBy, setSortBy]             = useState("date_asc");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [venues, setVenues]             = useState([]);
  const [selectedTicketEvent, setSelectedTicketEvent] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Fetch venues once ───────────────────────────────────────────────────────
  useEffect(() => {
    API.get("/events/venues")
      .then((r) => setVenues(r.data))
      .catch(() => {});
  }, []);

  // ── Fetch events with backend query params ──────────────────────────────────
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim())         params.search   = search.trim();
      if (selectedVenue)         params.venue    = selectedVenue;
      if (selectedCategory)      params.category = selectedCategory;
      if (selectedStatus)        params.status   = selectedStatus;
      if (sortBy !== "date_asc") params.sortBy   = sortBy;

      const res = await API.get("/events", { params });

      // Frontend filter: available seats only
      let data = res.data;
      if (availableOnly) {
        data = data.filter((e) => {
          const filled = e.registeredUsers?.length || 0;
          return filled < e.capacity;
        });
      }

      setEvents(data);
      setError("");
    } catch {
      setError("Unable to load events. Please verify the backend server is active.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedVenue, selectedCategory, selectedStatus, sortBy, availableOnly]);

  useEffect(() => {
    const timer = setTimeout(fetchEvents, 250);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  // ── Registration handlers ───────────────────────────────────────────────────
  const handleRegister = async (eventId) => {
    if (!user) {
      notify("Please login to register for this event.", "info");
      navigate("/login");
      return;
    }
    try {
      const res = await API.post(`/events/${eventId}/register`);
      notify(res.data.message || "Registration successful!", "success");
      fetchEvents();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to register.", "error");
    }
  };

  const handleCancelRegistration = async (eventId) => {
    try {
      const res = await API.delete(`/events/${eventId}/register`);
      notify(res.data.message || "Registration cancelled.", "info");
      fetchEvents();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to cancel registration.", "error");
    }
  };

  // ── Clear all filters ───────────────────────────────────────────────────────
  const clearAll = () => {
    setSearch("");
    setSelectedVenue("");
    setSelectedCategory("");
    setSelectedStatus("");
    setSortBy("date_asc");
    setAvailableOnly(false);
  };

  const hasActiveFilters =
    search || selectedVenue || selectedCategory || selectedStatus ||
    sortBy !== "date_asc" || availableOnly;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Hero Banner ── */}
      <header className="hero-banner">
        <div className="hero-content">
          <span className="badge-glow">Assignment 4 • Project 7</span>
          <h1>Experience Campus &amp; Tech Events Like Never Before</h1>
          <p>
            Browse curated workshops, cultural fests, and hackathons. Register instantly
            or manage attendees effortlessly with our streamlined platform.
          </p>
          <div className="hero-cta">
            <a href="#browse-section" className="btn-primary">Browse All Events ↓</a>
          </div>
        </div>
      </header>

      {/* ── Main Events Section ── */}
      <section className="browse-section" id="browse-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Browse Events</h2>
            <p className="section-subtitle">Reserve your spot before tickets run out</p>
          </div>
          <span className="event-count-badge">
            {loading ? "…" : `${events.length} ${events.length === 1 ? "Event" : "Events"}`} Found
          </span>
        </div>

        {/* ── Enhanced Filter Toolbar ── */}
        <div className="filters-panel">
          {/* Row 1: Search */}
          <div className="filter-row">
            <div className="search-input-wrap filter-grow">
              <span className="search-icon" aria-hidden="true">🔍</span>
              <input
                id="event-search"
                type="text"
                placeholder="Search by title, organizer, venue or keywords…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
                aria-label="Search events"
              />
              {search && (
                <button
                  className="clear-btn"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Dropdowns */}
          <div className="filter-row filter-dropdowns">
            {/* Venue */}
            <div className="filter-select-wrap">
              <label className="filter-label" htmlFor="venue-filter">📍 Venue</label>
              <select
                id="venue-filter"
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="filter-select"
              >
                <option value="">All Venues</option>
                {venues.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="filter-select-wrap">
              <label className="filter-label" htmlFor="category-filter">🏷️ Category</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="filter-select-wrap">
              <label className="filter-label" htmlFor="status-filter">🔄 Status</label>
              <select
                id="status-filter"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Sort */}
            <div className="filter-select-wrap">
              <label className="filter-label" htmlFor="sort-filter">↕️ Sort By</label>
              <select
                id="sort-filter"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Available only toggle */}
            <label className="filter-toggle" htmlFor="available-toggle">
              <input
                id="available-toggle"
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
              />
              <span className="toggle-label">Seats Available Only</span>
            </label>
          </div>

          {/* Row 3: Active filter chips + clear all */}
          {hasActiveFilters && (
            <div className="active-filters-row">
              <span className="active-filters-label">Active filters:</span>
              {search         && <FilterChip label={`"${search}"`}               onRemove={() => setSearch("")} />}
              {selectedVenue  && <FilterChip label={`📍 ${selectedVenue}`}        onRemove={() => setSelectedVenue("")} />}
              {selectedCategory && <FilterChip label={`🏷️ ${selectedCategory}`}   onRemove={() => setSelectedCategory("")} />}
              {selectedStatus && <FilterChip label={`🔄 ${selectedStatus}`}       onRemove={() => setSelectedStatus("")} />}
              {sortBy !== "date_asc" && <FilterChip label={SORT_OPTIONS.find(o => o.value === sortBy)?.label} onRemove={() => setSortBy("date_asc")} />}
              {availableOnly  && <FilterChip label="Seats Available Only"         onRemove={() => setAvailableOnly(false)} />}
              <button className="clear-all-btn" onClick={clearAll}>Clear All</button>
            </div>
          )}
        </div>

        {/* ── Error ── */}
        {error && <div className="alert-box error" role="alert">{error}</div>}

        {/* ── Content ── */}
        {loading ? (
          <div className="events-grid">
            {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <div className="state-box empty">
            <div className="empty-icon">📅</div>
            <h3>No events found</h3>
            <p>
              {hasActiveFilters
                ? "Try adjusting or clearing your filters to see more events."
                : "No events available. Check back soon!"}
            </p>
            {hasActiveFilters && (
              <button className="btn-secondary" style={{ marginTop: "16px" }} onClick={clearAll}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                onRegister={handleRegister}
                onCancelRegistration={handleCancelRegistration}
                onViewTicket={(ev) => setSelectedTicketEvent(ev)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Digital Ticket Modal ── */}
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
