import { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import EventModal from "../components/EventModal";

// ── small helpers ──────────────────────────────────────────────────────────────
const STATUS_COLOR = {
  upcoming: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
  ongoing:  { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe" },
  completed:{ bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  cancelled:{ bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
};

const CATEGORY_COLOR = {
  Technical: "#6366f1",
  Cultural:  "#ec4899",
  Workshop:  "#f59e0b",
  Hackathon: "#10b981",
  Seminar:   "#8b5cf6",
  Sports:    "#ef4444",
  Other:     "#64748b",
};

function StatCard({ icon, value, label, accent }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${accent}` }}>
      <div className="stat-icon" style={{ background: `${accent}18` }}>
        {icon}
      </div>
      <div className="stat-info">
        <span className="stat-value" style={{ color: accent }}>
          {value}
        </span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i}>
          <div className="skeleton-line" style={{ width: i === 0 ? "80%" : "60%" }} />
        </td>
      ))}
    </tr>
  );
}

export default function AdminDashboard({ notify }) {
  const [events, setEvents]         = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ── data fetchers ────────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/events");
      setEvents(res.data);
    } catch {
      notify("Failed to load events for dashboard.", "error");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await API.get("/events/stats");
      setStats(res.data);
    } catch {
      // stats panel degrades gracefully — we don't block the page
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, [fetchEvents, fetchStats]);

  const refresh = () => {
    fetchEvents();
    fetchStats();
  };

  // ── modal handlers ───────────────────────────────────────────────────────────
  const handleOpenCreate = () => { setEventToEdit(null); setIsModalOpen(true); };
  const handleOpenEdit   = (ev) => { setEventToEdit(ev);  setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setEventToEdit(null); };

  const handleSaveEvent = async (formData) => {
    try {
      if (eventToEdit) {
        await API.put(`/events/${eventToEdit._id}`, formData);
        notify("Event updated successfully!", "success");
      } else {
        await API.post("/events", formData);
        notify("Event created successfully!", "success");
      }
      handleCloseModal();
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to save event.", "error");
    }
  };

  // ── delete with confirm ──────────────────────────────────────────────────────
  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`⚠️ Permanently delete "${title}"?\n\nThis action cannot be undone.`)) return;
    try {
      setDeletingId(id);
      await API.delete(`/events/${id}`);
      notify("Event deleted successfully.", "success");
      refresh();
    } catch (err) {
      notify(err.response?.data?.message || "Failed to delete event.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // ── derived values (fallback when stats API not available) ───────────────────
  const totalEvents         = stats?.totalEvents         ?? events.length;
  const upcomingCount       = stats?.upcomingCount       ?? events.filter(e => new Date(e.date) >= new Date()).length;
  const totalRegistrations  = stats?.totalRegistrations  ?? events.reduce((a, e) => a + (e.registeredUsers?.length || 0), 0);
  const fillRate            = stats?.fillRate            ?? 0;

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="page-container admin-dashboard">
      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <span className="badge-pill">Admin Management Console</span>
          <h2>Event Operations Dashboard</h2>
          <p>Create, update, monitor registrations, and manage all events.</p>
        </div>
        <button className="btn-primary" onClick={handleOpenCreate} id="create-event-btn">
          + Create New Event
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="stats-grid">
        <StatCard
          icon="📅"
          value={statsLoading ? "—" : totalEvents}
          label="Total Events"
          accent="#6366f1"
        />
        <StatCard
          icon="🚀"
          value={statsLoading ? "—" : upcomingCount}
          label="Upcoming Events"
          accent="#10b981"
        />
        <StatCard
          icon="👥"
          value={statsLoading ? "—" : totalRegistrations}
          label="Total Registrations"
          accent="#ec4899"
        />
        <StatCard
          icon="🎯"
          value={statsLoading ? "—" : `${fillRate}%`}
          label="Overall Fill Rate"
          accent="#f59e0b"
        />
      </div>

      {/* ── Category Breakdown (only when stats are available) ── */}
      {stats?.categoryBreakdown?.length > 0 && (
        <div className="category-breakdown-bar">
          <span className="breakdown-label">Events by Category:</span>
          <div className="breakdown-chips">
            {stats.categoryBreakdown.map((cb) => (
              <span
                key={cb._id}
                className="cat-chip"
                style={{
                  background: `${CATEGORY_COLOR[cb._id] || "#64748b"}18`,
                  color: CATEGORY_COLOR[cb._id] || "#64748b",
                  border: `1px solid ${CATEGORY_COLOR[cb._id] || "#64748b"}40`,
                }}
              >
                {cb._id || "Other"} · {cb.count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Events Table ── */}
      <div className="table-card">
        <div className="table-card-header">
          <h3>All Scheduled Events</h3>
          <span className="count-tag">{totalEvents} records</span>
        </div>

        {loading ? (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Name</th><th>Date</th><th>Venue</th>
                  <th>Organizer</th><th>Category</th><th>Capacity</th>
                  <th>Registered</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(4)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : events.length === 0 ? (
          <div className="state-box empty">
            <div className="empty-icon">🗂️</div>
            <h3>No events yet</h3>
            <p>Click <strong>+ Create New Event</strong> to get started.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Organizer</th>
                  <th>Category</th>
                  <th>Capacity</th>
                  <th>Registered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => {
                  const regCount  = e.registeredUsers?.length || 0;
                  const pct       = e.capacity ? Math.round((regCount / e.capacity) * 100) : 0;
                  const statusStyle = STATUS_COLOR[e.status] || STATUS_COLOR.upcoming;
                  const catColor  = CATEGORY_COLOR[e.category] || "#64748b";

                  return (
                    <tr key={e._id} className={deletingId === e._id ? "row-deleting" : ""}>
                      <td className="event-cell">
                        <strong>{e.title}</strong>
                        <span className="table-subtext">
                          {e.description?.slice(0, 48)}{e.description?.length > 48 ? "…" : ""}
                        </span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {new Date(e.date).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td>{e.venue}</td>
                      <td>{e.organizer}</td>
                      <td>
                        <span
                          className="cat-chip"
                          style={{
                            background: `${catColor}15`,
                            color: catColor,
                            border: `1px solid ${catColor}35`,
                          }}
                        >
                          {e.category || "—"}
                        </span>
                      </td>
                      <td>{e.capacity}</td>
                      <td>
                        <div className="reg-mini-wrap">
                          <span className="reg-badge">{regCount} / {e.capacity}</span>
                          <div className="mini-progress">
                            <div
                              className="mini-progress-fill"
                              style={{
                                width: `${pct}%`,
                                background: pct >= 90 ? "#ef4444" : pct >= 60 ? "#f59e0b" : "#10b981",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className="status-badge"
                          style={{
                            background: statusStyle.bg,
                            color: statusStyle.color,
                            border: `1px solid ${statusStyle.border}`,
                          }}
                        >
                          {e.status || "upcoming"}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-sm edit"
                            onClick={() => handleOpenEdit(e)}
                            title="Edit Event"
                            id={`edit-btn-${e._id}`}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-sm delete"
                            onClick={() => handleDeleteEvent(e._id, e.title)}
                            title="Delete Event"
                            disabled={deletingId === e._id}
                            id={`delete-btn-${e._id}`}
                          >
                            {deletingId === e._id ? "…" : "🗑️ Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
      />
    </div>
  );
}
