import { useState, useEffect } from "react";

const CATEGORIES = ["Technical", "Cultural", "Workshop", "Hackathon", "Seminar", "Sports", "Other"];
const STATUSES   = ["upcoming", "ongoing", "completed", "cancelled"];

const EMPTY_FORM = {
  title: "",
  description: "",
  date: "",
  venue: "",
  organizer: "",
  capacity: 100,
  category: "Technical",
  status: "upcoming",
};

export default function EventModal({ isOpen, onClose, onSave, eventToEdit }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError]       = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (eventToEdit) {
      setFormData({
        title:       eventToEdit.title       || "",
        description: eventToEdit.description || "",
        date:        eventToEdit.date        ? eventToEdit.date.slice(0, 10) : "",
        venue:       eventToEdit.venue       || "",
        organizer:   eventToEdit.organizer   || "",
        capacity:    eventToEdit.capacity    || 100,
        category:    eventToEdit.category    || "Technical",
        status:      eventToEdit.status      || "upcoming",
      });
    } else {
      setFormData(EMPTY_FORM);
    }
    setError("");
  }, [eventToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { title, date, venue, organizer, capacity, description } = formData;

    if (!title.trim() || !date || !venue.trim() || !organizer.trim() || !description.trim()) {
      setError("Please fill out all required fields.");
      return;
    }
    if (Number(capacity) < 1) {
      setError("Capacity must be at least 1.");
      return;
    }

    setSaving(true);
    try {
      await onSave({ ...formData, capacity: Number(formData.capacity) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card">
        <div className="modal-header">
          <h3 id="modal-title">{eventToEdit ? "✏️ Edit Event" : "➕ Create New Event"}</h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        {error && (
          <div className="form-error" role="alert">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form" noValidate>
          {/* Title */}
          <div className="form-group">
            <label htmlFor="modal-title-input">Event Title <span className="req">*</span></label>
            <input
              id="modal-title-input"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Annual Tech Symposium 2026"
              maxLength={120}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="modal-desc">Description <span className="req">*</span></label>
            <textarea
              id="modal-desc"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide event details, schedule or highlights..."
              required
            />
          </div>

          {/* Date + Capacity */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="modal-date">Event Date <span className="req">*</span></label>
              <input
                id="modal-date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="modal-capacity">Capacity <span className="req">*</span></label>
              <input
                id="modal-capacity"
                type="number"
                name="capacity"
                min="1"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Venue + Organizer */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="modal-venue">Venue <span className="req">*</span></label>
              <input
                id="modal-venue"
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g. Main Auditorium, Hall B"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="modal-organizer">Organizer <span className="req">*</span></label>
              <input
                id="modal-organizer"
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
                placeholder="e.g. ACM Student Chapter"
                required
              />
            </div>
          </div>

          {/* Category + Status */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="modal-category">Category</label>
              <select
                id="modal-category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="modal-status">Status</label>
              <select
                id="modal-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving} id="modal-save-btn">
              {saving ? "Saving…" : eventToEdit ? "Save Changes" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
