import { useState } from "react";
import api from "../services/api";
import { FaCheckSquare, FaPlus, FaTimes, FaCalendarAlt, FaAward } from "react-icons/fa";
import "./QuickCreateTodoModal.css";

function QuickCreateTodoModal({ isOpen, onClose, onTodoCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSaving(true);
      const res = await api.post("todos/", {
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate || null,
        points_value: 15
      });

      setSuccessMsg("✨ Daily To-Do Created Successfully (+15 Pts)!");
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setSuccessMsg("");
        setSaving(false);
        if (onTodoCreated) onTodoCreated(res.data);
        window.dispatchEvent(new CustomEvent("todo-created", { detail: res.data }));
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Quick create todo error:", err);
      alert("Failed to create to-do item. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="quick-todo-overlay" onClick={onClose}>
      <div className="quick-todo-modal glass-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="quick-todo-header">
          <div className="quick-todo-title-row">
            <div className="quick-todo-icon-wrap">
              <FaCheckSquare className="icon-main" />
            </div>
            <div>
              <h3>Quick Create Daily To-Do</h3>
              <p>Add a quick task to your daily list from anywhere</p>
            </div>
          </div>
          <button className="quick-todo-close-btn" onClick={onClose} title="Close">
            <FaTimes />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="quick-todo-form-body">
          {successMsg && (
            <div className="quick-todo-success-banner">
              <FaAward /> {successMsg}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">To-Do Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Follow up on client ticket #104..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes / Description (Optional)</label>
            <textarea
              className="form-textarea"
              rows="2"
              placeholder="Brief details or steps..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label"><FaCalendarAlt /> Target Date</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="quick-todo-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-quick-submit" disabled={saving || !title.trim()}>
              <FaPlus /> {saving ? "Saving..." : "Add To-Do (+15 Pts)"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default QuickCreateTodoModal;
