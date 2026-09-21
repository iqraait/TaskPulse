import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  FaCheckSquare, 
  FaSquare, 
  FaPlus, 
  FaShareAlt, 
  FaTrophy, 
  FaPaperPlane, 
  FaUser, 
  FaInbox, 
  FaTrash, 
  FaClock, 
  FaCheck, 
  FaTimes, 
  FaCalendarAlt,
  FaExclamationCircle,
  FaAward
} from "react-icons/fa";
import "./TodoList.css";

function TodoList() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [incomingShares, setIncomingShares] = useState([]);
  const [deptStaff, setDeptStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // New todo form inputs
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [adding, setAdding] = useState(false);

  // Sharing state
  const [selectedIds, setSelectedIds] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [sharing, setSharing] = useState(false);
  const [successBanner, setSuccessBanner] = useState("");

  const userDept = user?.department || "General";

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const [todosRes, sharesRes, usersRes] = await Promise.all([
        api.get("todos/"),
        api.get("todo-shares/"),
        api.get("users/")
      ]);

      setTodos(todosRes.data);
      // Filter incoming share requests that are pending
      setIncomingShares(sharesRes.data.filter(s => s.status === "pending"));
      // Filter department staff members (excluding self)
      setDeptStaff(usersRes.data.filter(u => u.id !== user?.id && (u.department === userDept || user?.is_superuser)));
    } catch (err) {
      console.error("Error loading todos:", err);
    } finally {
      setLoading(false);
    }
  }, [user, userDept]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setAdding(true);
      const res = await api.post("todos/", {
        title: newTitle,
        description: newDesc,
        due_date: newDueDate || null,
        points_value: 15
      });
      setTodos([res.data, ...todos]);
      setNewTitle("");
      setNewDesc("");
      setNewDueDate("");
      setSuccessBanner("✨ Daily To-Do added to your personal list!");
      setTimeout(() => setSuccessBanner(""), 3000);
    } catch (err) {
      console.error("Create todo error:", err);
      alert("Failed to create todo item.");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleComplete = async (id) => {
    try {
      const res = await api.post(`todos/${id}/toggle_complete/`);
      setTodos(todos.map(t => t.id === id ? { ...t, is_completed: res.data.is_completed, completed_at: res.data.completed_at } : t));
      if (res.data.is_completed) {
        setSuccessBanner("🎉 +15 Reward Points Earned for completing this task!");
        setTimeout(() => setSuccessBanner(""), 3500);
      }
    } catch (err) {
      console.error("Toggle todo error:", err);
    }
  };

  const handleDeleteTodo = async (id) => {
    if (window.confirm("Are you sure you want to delete this To-Do item?")) {
      try {
        await api.delete(`todos/${id}/`);
        setTodos(todos.filter(t => t.id !== id));
        setSelectedIds(selectedIds.filter(i => i !== id));
      } catch (err) {
        console.error("Delete todo error:", err);
      }
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === todos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(todos.map(t => t.id));
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRecipient) {
      alert("Please select a colleague to send the to-do list items to.");
      return;
    }

    try {
      setSharing(true);
      const res = await api.post("todos/share_items/", {
        item_ids: selectedIds,
        recipient_id: parseInt(selectedRecipient)
      });

      setSuccessBanner(`🚀 ${res.data.shared_count} To-Do items sent successfully to ${res.data.recipient}!`);
      setShowShareModal(false);
      setSelectedIds([]);
      setSelectedRecipient("");
      setTimeout(() => setSuccessBanner(""), 4000);
    } catch (err) {
      console.error("Share error:", err);
      alert("Failed to share items.");
    } finally {
      setSharing(false);
    }
  };

  const handleAcceptShare = async (shareId) => {
    try {
      await api.post(`todo-shares/${shareId}/accept/`);
      setSuccessBanner("📥 Shared To-Do added to your daily task list!");
      fetchTodos();
      setTimeout(() => setSuccessBanner(""), 3500);
    } catch (err) {
      console.error("Accept share error:", err);
    }
  };

  const handleDeclineShare = async (shareId) => {
    try {
      await api.post(`todo-shares/${shareId}/decline/`);
      setIncomingShares(incomingShares.filter(s => s.id !== shareId));
    } catch (err) {
      console.error("Decline share error:", err);
    }
  };

  const pendingCount = todos.filter(t => !t.is_completed).length;
  const completedCount = todos.filter(t => t.is_completed).length;
  const earnedPoints = completedCount * 15;

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="page-container">
          
          {/* Header Banner */}
          <div className="todo-header-card glass-card">
            <div className="todo-header-left">
              <h2><FaCheckSquare className="header-icon" /> My Personal Daily To-Do List</h2>
              <p>Private workspace for your daily tasks. Complete to-dos to earn reward points & level up!</p>
            </div>

            <div className="todo-header-stats">
              <div className="stat-pill-gold">
                <FaTrophy className="pill-icon" />
                <div className="pill-text">
                  <span className="pill-val">{earnedPoints} PTS</span>
                  <span className="pill-lbl">Points Earned</span>
                </div>
              </div>
              <div className="stat-pill-blue">
                <FaCheckSquare className="pill-icon" />
                <div className="pill-text">
                  <span className="pill-val">{completedCount}/{todos.length}</span>
                  <span className="pill-lbl">Completed</span>
                </div>
              </div>
            </div>
          </div>

          {successBanner && (
            <div className="success-banner todo-success-banner">
              <FaAward /> {successBanner}
            </div>
          )}

          {/* Incoming Shared To-Dos Alert Box */}
          {incomingShares.length > 0 && (
            <div className="incoming-shares-alert-box glass-card">
              <div className="incoming-header-row">
                <h4><FaInbox className="inbox-icon" /> Incoming Shared To-Dos ({incomingShares.length})</h4>
                <span className="inbox-subtext">Colleagues in your department have sent you tasks to add to your daily list:</span>
              </div>

              <div className="incoming-shares-list">
                {incomingShares.map((s) => (
                  <div key={s.id} className="incoming-share-item">
                    <div className="share-info">
                      <strong>{s.title}</strong>
                      <span>From 👤 <strong>{s.sender_username}</strong> {s.description ? `— "${s.description}"` : ""}</span>
                    </div>
                    <div className="share-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleAcceptShare(s.id)}>
                        <FaCheck /> Add to My List (+15 Pts)
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleDeclineShare(s.id)}>
                        <FaTimes /> Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Grid Layout */}
          <div className="todo-grid-layout">
            
            {/* Left: To-Do Items List & Batch Share Controls */}
            <div className="todo-left-column">
              <div className="todo-toolbar glass-card">
                <div className="toolbar-left">
                  <button type="button" className="btn-select-all-todo" onClick={handleSelectAll}>
                    {selectedIds.length === todos.length && todos.length > 0 ? <FaCheckSquare /> : <FaSquare />} Select All
                  </button>
                  <span className="selected-count-label">
                    {selectedIds.length} item(s) selected
                  </span>
                </div>

                {selectedIds.length > 0 && (
                  <button 
                    className="btn btn-primary btn-sm btn-share-trigger"
                    onClick={() => setShowShareModal(true)}
                  >
                    <FaShareAlt /> Share Selected To-Dos to Staff
                  </button>
                )}
              </div>

              {/* Todos List */}
              <div className="todo-list-container">
                {loading ? (
                  <div className="board-loading">Loading your daily tasks...</div>
                ) : todos.length === 0 ? (
                  <div className="empty-todo-box glass-card">
                    <FaCheckSquare className="empty-icon" />
                    <h3>Your Daily To-Do List is Empty!</h3>
                    <p>Create a task using the form on the right or receive shared items from department staff.</p>
                  </div>
                ) : (
                  todos.map((item) => (
                    <div 
                      key={item.id} 
                      className={`todo-card glass-card ${item.is_completed ? "completed" : ""} ${selectedIds.includes(item.id) ? "selected" : ""}`}
                    >
                      <div className="todo-card-left">
                        <input
                          type="checkbox"
                          className="todo-select-checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />

                        <button 
                          type="button" 
                          className={`todo-check-btn ${item.is_completed ? "checked" : ""}`}
                          onClick={() => handleToggleComplete(item.id)}
                          title={item.is_completed ? "Mark pending" : "Mark completed (+15 Pts)"}
                        >
                          {item.is_completed ? <FaCheckSquare /> : <FaSquare />}
                        </button>

                        <div className="todo-text-block">
                          <h4 className="todo-title">{item.title}</h4>
                          {item.description && <p className="todo-desc">{item.description}</p>}
                          <div className="todo-meta">
                            {item.shared_from_username && (
                              <span className="meta-shared-tag">
                                📩 Shared from: <strong>{item.shared_from_username}</strong>
                              </span>
                            )}
                            {item.due_date && (
                              <span className="meta-date-tag">
                                <FaCalendarAlt /> Due: {item.due_date}
                              </span>
                            )}
                            <span className="meta-pts-tag">+15 Reward Points</span>
                          </div>
                        </div>
                      </div>

                      <button 
                        className="btn-delete-todo" 
                        onClick={() => handleDeleteTodo(item.id)}
                        title="Delete item"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right: Quick Create Form */}
            <div className="todo-right-column">
              <div className="quick-create-card glass-card">
                <h3><FaPlus className="header-icon" /> Add Daily To-Do Task</h3>
                <p className="card-sub">This task remains private to you unless shared with colleagues.</p>

                <form onSubmit={handleCreateTodo} className="quick-todo-form">
                  <div className="form-group">
                    <label className="form-label">Task Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., Review morning server backup logs"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes / Description (Optional)</label>
                    <textarea
                      className="form-textarea"
                      rows="3"
                      placeholder="Additional details or steps..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Target Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={adding}>
                    {adding ? "Adding..." : "+ Add to My Daily List (+15 Pts)"}
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* Share Modal */}
          {showShareModal && (
            <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
              <div className="modal-content share-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3><FaShareAlt /> Share Selected To-Dos to Department Staff</h3>
                  <button className="icon-btn" onClick={() => setShowShareModal(false)}>
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleShareSubmit}>
                  <div className="modal-body">
                    <p className="share-modal-desc">
                      Sending <strong>{selectedIds.length} selected task(s)</strong> to a staff member in <strong>{userDept}</strong>. The recipient can accept and add them to their own daily to-do list.
                    </p>

                    <div className="form-group">
                      <label className="form-label"><FaUser /> Select Staff Member *</label>
                      <select
                        className="form-select"
                        value={selectedRecipient}
                        onChange={(e) => setSelectedRecipient(e.target.value)}
                        required
                      >
                        <option value="">-- Choose Staff Member in {userDept} --</option>
                        {deptStaff.map((s) => (
                          <option key={s.id} value={s.id}>
                            👤 {s.username} ({s.role || "staff"}) — {s.department || "General"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowShareModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={sharing}>
                      {sharing ? "Sending..." : "📤 Send To-Dos Now"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default TodoList;
