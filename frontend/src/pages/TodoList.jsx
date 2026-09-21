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
  FaUser, 
  FaInbox, 
  FaTrash, 
  FaCheck, 
  FaTimes, 
  FaCalendarAlt,
  FaAward,
  FaListAlt,
  FaPaperPlane,
  FaExclamationTriangle,
  FaInfoCircle,
  FaUsers
} from "react-icons/fa";
import "./TodoList.css";

function TodoList() {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [incomingShares, setIncomingShares] = useState([]);
  const [sentShares, setSentShares] = useState([]);
  const [deptStaff, setDeptStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my_todos"); // "my_todos" | "sent_shares"

  // New todo form inputs
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [adding, setAdding] = useState(false);

  // Sharing state (Multi-staff selection)
  const [selectedIds, setSelectedIds] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState([]);
  const [sharing, setSharing] = useState(false);

  // Accept modal state with target date
  const [acceptingShare, setAcceptingShare] = useState(null);
  const [acceptTargetDate, setAcceptTargetDate] = useState(new Date().toISOString().split('T')[0]);

  // Reject modal state with reason
  const [rejectingShare, setRejectingShare] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Completion modal state with optional completion note
  const [completingTodo, setCompletingTodo] = useState(null);
  const [completionNote, setCompletionNote] = useState("");

  const [successBanner, setSuccessBanner] = useState("");
  const [errorBanner, setErrorBanner] = useState("");

  const userDept = user?.department || "General";

  // Date-Wise Grouping Helper Functions
  const groupTodosByDate = (todoList) => {
    const groups = {};
    todoList.forEach((item) => {
      let dateKey = item.due_date;
      if (!dateKey && item.created_at) {
        dateKey = item.created_at.split('T')[0];
      }
      if (!dateKey) {
        dateKey = "Unscheduled";
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Unscheduled") return 1;
      if (b === "Unscheduled") return -1;
      return new Date(b) - new Date(a);
    });

    return sortedKeys.map(key => ({
      dateKey: key,
      items: groups[key]
    }));
  };

  const formatGroupDateHeader = (dateStr) => {
    if (dateStr === "Unscheduled") return "📋 Unscheduled Tasks";
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    try {
      const d = new Date(dateStr + "T00:00:00");
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (dateStr === todayStr) return `📅 Today (${formatted})`;
      if (dateStr === tomorrowStr) return `📅 Tomorrow (${formatted})`;
      return `📅 ${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch {
      return `📅 ${dateStr}`;
    }
  };

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const [todosRes, sharesRes, sentSharesRes, usersRes] = await Promise.all([
        api.get("todos/"),
        api.get("todo-shares/"),
        api.get("todo-shares/sent_shares/"),
        api.get("users/")
      ]);

      setTodos(todosRes.data);
      // Filter incoming pending share requests
      setIncomingShares(sharesRes.data.filter(s => s.status === "pending"));
      setSentShares(sentSharesRes.data);
      // Department staff members (excluding self)
      setDeptStaff(usersRes.data.filter(u => u.id !== user?.id && (u.department === userDept || user?.is_superuser)));
    } catch (err) {
      console.error("Error loading todos:", err);
    } finally {
      setLoading(false);
    }
  }, [user, userDept]);

  useEffect(() => {
    fetchTodos();
    const handleGlobalCreated = () => fetchTodos();
    window.addEventListener("todo-created", handleGlobalCreated);
    return () => window.removeEventListener("todo-created", handleGlobalCreated);
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
      setErrorBanner("Failed to create todo item.");
      setTimeout(() => setErrorBanner(""), 3000);
    } finally {
      setAdding(false);
    }
  };

  const handleOpenCompleteModal = (item) => {
    if (item.is_completed) {
      executeToggleComplete(item.id, "");
    } else {
      setCompletingTodo(item);
      setCompletionNote("");
    }
  };

  const executeToggleComplete = async (id, note) => {
    try {
      const res = await api.post(`todos/${id}/toggle_complete/`, {
        completion_note: note
      });
      setTodos(todos.map(t => t.id === id ? { 
        ...t, 
        is_completed: res.data.is_completed, 
        completed_at: res.data.completed_at,
        completion_note: res.data.completion_note 
      } : t));
      if (res.data.is_completed) {
        setSuccessBanner("🎉 +15 Reward Points Earned for completing this task!");
        setTimeout(() => setSuccessBanner(""), 3500);
      }
      setCompletingTodo(null);
      setCompletionNote("");
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

  // Multi-Staff Selection Handlers
  const toggleRecipientSelect = (id) => {
    if (selectedRecipientIds.includes(id)) {
      setSelectedRecipientIds(selectedRecipientIds.filter(i => i !== id));
    } else {
      setSelectedRecipientIds([...selectedRecipientIds, id]);
    }
  };

  const toggleSelectAllRecipients = () => {
    if (selectedRecipientIds.length === deptStaff.length) {
      setSelectedRecipientIds([]);
    } else {
      setSelectedRecipientIds(deptStaff.map(s => s.id));
    }
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (selectedRecipientIds.length === 0) {
      alert("Please select at least one staff member to send to.");
      return;
    }

    try {
      setSharing(true);
      const res = await api.post("todos/share_items/", {
        item_ids: selectedIds,
        recipient_ids: selectedRecipientIds
      });

      const recipientNames = res.data.recipients.join(", ");
      setSuccessBanner(`🚀 ${selectedIds.length} To-Do item(s) sent successfully to (${selectedRecipientIds.length}) staff member(s): ${recipientNames}!`);
      setShowShareModal(false);
      setSelectedIds([]);
      setSelectedRecipientIds([]);
      fetchTodos();
      setTimeout(() => setSuccessBanner(""), 4500);
    } catch (err) {
      console.error("Share error:", err);
      setErrorBanner("Failed to share items.");
      setTimeout(() => setErrorBanner(""), 3000);
    } finally {
      setSharing(false);
    }
  };

  // Accept Share with Target Date
  const handleOpenAcceptModal = (share) => {
    setAcceptingShare(share);
    setAcceptTargetDate(share.target_date || new Date().toISOString().split('T')[0]);
  };

  const handleConfirmAcceptShare = async (e) => {
    e.preventDefault();
    if (!acceptingShare) return;

    try {
      await api.post(`todo-shares/${acceptingShare.id}/accept/`, {
        target_date: acceptTargetDate
      });

      setSuccessBanner(`📥 "${acceptingShare.title}" accepted & scheduled for ${acceptTargetDate}!`);
      setAcceptingShare(null);
      fetchTodos();
      setTimeout(() => setSuccessBanner(""), 4000);
    } catch (err) {
      console.error("Accept share error:", err);
    }
  };

  // Reject Share with Reason
  const handleOpenRejectModal = (share) => {
    setRejectingShare(share);
    setRejectionReason("");
  };

  const handleConfirmRejectShare = async (e) => {
    e.preventDefault();
    if (!rejectingShare) return;
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejecting the task.");
      return;
    }

    try {
      await api.post(`todo-shares/${rejectingShare.id}/reject/`, {
        rejection_reason: rejectionReason
      });

      setSuccessBanner(`❌ Task rejected and reason returned to ${rejectingShare.sender_username}.`);
      setRejectingShare(null);
      setRejectionReason("");
      fetchTodos();
      setTimeout(() => setSuccessBanner(""), 4000);
    } catch (err) {
      console.error("Reject share error:", err);
    }
  };

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
              <h2><FaCheckSquare className="header-icon" /> Personal Daily To-Do & Task Distribution</h2>
              <p>Manage daily tasks, share with multiple team members, schedule target dates, and track rejection reasons.</p>
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

          {errorBanner && (
            <div className="error-banner todo-error-banner">
              <FaExclamationTriangle /> {errorBanner}
            </div>
          )}

          {/* Navigation Sub-Tabs */}
          <div className="todo-nav-tabs">
            <button 
              className={`tab-btn ${activeTab === "my_todos" ? "active" : ""}`}
              onClick={() => setActiveTab("my_todos")}
            >
              <FaListAlt /> My Daily Tasks ({todos.length})
            </button>

            <button 
              className={`tab-btn ${activeTab === "sent_shares" ? "active" : ""}`}
              onClick={() => setActiveTab("sent_shares")}
            >
              <FaPaperPlane /> Sent Tasks Status Audit ({sentShares.length})
            </button>
          </div>

          {/* Incoming Shared To-Dos Alert Box */}
          {incomingShares.length > 0 && activeTab === "my_todos" && (
            <div className="incoming-shares-alert-box glass-card">
              <div className="incoming-header-row">
                <h4><FaInbox className="inbox-icon" /> Incoming Shared To-Dos ({incomingShares.length})</h4>
                <span className="inbox-subtext">Colleagues in your department have sent you tasks to add to your list:</span>
              </div>

              <div className="incoming-shares-list">
                {incomingShares.map((s) => (
                  <div key={s.id} className="incoming-share-item">
                    <div className="share-info">
                      <strong>{s.title}</strong>
                      <span>From 👤 <strong>{s.sender_username}</strong> {s.description ? `— "${s.description}"` : ""}</span>
                    </div>
                    <div className="share-actions">
                      <button className="btn btn-primary btn-sm" onClick={() => handleOpenAcceptModal(s)}>
                        <FaCheck /> Accept & Schedule Date (+15 Pts)
                      </button>
                      <button className="btn btn-secondary btn-sm btn-reject-action" onClick={() => handleOpenRejectModal(s)}>
                        <FaTimes /> Decline / Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "my_todos" ? (
            /* Main Grid Layout */
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
                      onClick={() => {
                        setSelectedRecipientIds([]);
                        setShowShareModal(true);
                      }}
                    >
                      <FaShareAlt /> Share Selected To-Dos to Staff
                    </button>
                  )}
                </div>

                {/* Todos List (Date-Wise Grouped) */}
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
                    groupTodosByDate(todos).map((group) => {
                      const pendingCount = group.items.filter(i => !i.is_completed).length;
                      return (
                        <div key={group.dateKey} className="todo-date-group">
                          <div className="todo-date-group-header">
                            <div className="date-header-left">
                              <FaCalendarAlt className="date-icon" />
                              <h3>{formatGroupDateHeader(group.dateKey)}</h3>
                              <span className="date-count-badge">{group.items.length} tasks</span>
                            </div>
                            {pendingCount > 0 && (
                              <span className="pending-red-badge">
                                ⚡ {pendingCount} PENDING
                              </span>
                            )}
                          </div>

                          <div className="date-group-items-list">
                            {group.items.map((item) => (
                              <div 
                                key={item.id} 
                                className={`todo-card glass-card ${item.is_completed ? "completed" : "pending-red-card"} ${selectedIds.includes(item.id) ? "selected" : ""}`}
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
                                    onClick={() => handleOpenCompleteModal(item)}
                                    title={item.is_completed ? "Mark pending" : "Mark completed (+15 Pts)"}
                                  >
                                    {item.is_completed ? <FaCheckSquare /> : <FaSquare />}
                                  </button>

                                  <div className="todo-text-block">
                                    <h4 className="todo-title">{item.title}</h4>
                                    {item.description && <p className="todo-desc">{item.description}</p>}
                                    {item.completion_note && (
                                      <div className="todo-completion-note-tag">
                                        💬 <strong>Completion Note:</strong> "{item.completion_note}"
                                      </div>
                                    )}
                                    <div className="todo-meta">
                                      {!item.is_completed && (
                                        <span className="meta-pending-red-tag">⚡ PENDING</span>
                                      )}
                                      {item.shared_from_username && (
                                        <span className="meta-shared-tag">
                                          📩 Shared from: <strong>{item.shared_from_username}</strong>
                                        </span>
                                      )}
                                      {item.due_date && (
                                        <span className="meta-date-tag">
                                          <FaCalendarAlt /> Target: {item.due_date}
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
                            ))}
                          </div>
                        </div>
                      );
                    })
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
          ) : (
            /* Sent Shares Status Tracking Tab */
            <div className="sent-shares-container glass-card">
              <div className="sent-shares-header">
                <h3><FaPaperPlane className="header-icon" /> Outgoing Shared Tasks Status Audit</h3>
                <p>Track whether staff members accepted or rejected tasks you distributed to them.</p>
              </div>

              {sentShares.length === 0 ? (
                <div className="empty-sent-box">
                  <FaInfoCircle className="empty-icon" />
                  <p>You haven't shared any daily to-do tasks with colleagues yet.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="sent-shares-table">
                    <thead>
                      <tr>
                        <th>Recipient Staff</th>
                        <th>Task Title</th>
                        <th>Date Sent</th>
                        <th>Status</th>
                        <th>Target Date / Rejection Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentShares.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <strong className="recipient-name">👤 {s.recipient_username}</strong>
                          </td>
                          <td>
                            <div className="sent-title-block">
                              <strong>{s.title}</strong>
                              {s.description && <span className="sent-desc">{s.description}</span>}
                            </div>
                          </td>
                          <td className="date-col">
                            {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td>
                            {s.status === 'pending' && <span className="status-badge status-pending">⏳ Pending</span>}
                            {s.status === 'accepted' && <span className="status-badge status-accepted">✅ Accepted</span>}
                            {(s.status === 'rejected' || s.status === 'declined') && <span className="status-badge status-rejected">❌ Rejected</span>}
                          </td>
                          <td>
                            {s.status === 'accepted' && (
                              <span className="target-date-pill">
                                <FaCalendarAlt /> Scheduled: {s.target_date || "Today"}
                              </span>
                            )}
                            {(s.status === 'rejected' || s.status === 'declined') && (
                              <div className="rejection-reason-box">
                                <strong>Reason:</strong> <em>"{s.rejection_reason || "No reason specified"}"</em>
                              </div>
                            )}
                            {s.status === 'pending' && <span className="text-muted">Awaiting recipient action...</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Multi-Staff Share Modal */}
          {showShareModal && (
            <div className="modal-overlay" onClick={() => setShowShareModal(false)}>
              <div className="modal-content share-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3><FaShareAlt /> Share Selected To-Dos to Multiple Staff Members</h3>
                  <button className="icon-btn" onClick={() => setShowShareModal(false)}>
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleShareSubmit}>
                  <div className="modal-body">
                    <p className="share-modal-desc">
                      Distributing <strong>{selectedIds.length} selected task(s)</strong> to staff in <strong>{userDept}</strong>. Select one or multiple team members below:
                    </p>

                    <div className="multi-staff-select-header">
                      <button 
                        type="button" 
                        className="btn-select-all-staff"
                        onClick={toggleSelectAllRecipients}
                      >
                        {selectedRecipientIds.length === deptStaff.length && deptStaff.length > 0 ? <FaCheckSquare /> : <FaSquare />} Select All Department Staff ({deptStaff.length})
                      </button>
                      <span className="staff-selected-count">{selectedRecipientIds.length} staff selected</span>
                    </div>

                    <div className="staff-checkbox-list">
                      {deptStaff.length === 0 ? (
                        <p className="text-muted padding-12">No other staff members found in your department.</p>
                      ) : (
                        deptStaff.map((staff) => (
                          <label key={staff.id} className={`staff-checkbox-item ${selectedRecipientIds.includes(staff.id) ? "selected" : ""}`}>
                            <input
                              type="checkbox"
                              checked={selectedRecipientIds.includes(staff.id)}
                              onChange={() => toggleRecipientSelect(staff.id)}
                            />
                            <div className="staff-checkbox-info">
                              <strong>👤 {staff.username}</strong>
                              <span>{staff.role || "staff"} • {staff.department || "General"}</span>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowShareModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={sharing || selectedRecipientIds.length === 0}>
                      {sharing ? "Sending..." : `📤 Send to ${selectedRecipientIds.length} Staff Member(s)`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Accept Modal with Target Date Selection */}
          {acceptingShare && (
            <div className="modal-overlay" onClick={() => setAcceptingShare(null)}>
              <div className="modal-content accept-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3><FaCheck /> Accept Shared To-Do & Set Target Date</h3>
                  <button className="icon-btn" onClick={() => setAcceptingShare(null)}>
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleConfirmAcceptShare}>
                  <div className="modal-body">
                    <div className="accept-task-summary">
                      <h4>{acceptingShare.title}</h4>
                      {acceptingShare.description && <p>{acceptingShare.description}</p>}
                      <span className="sender-tag">Shared by: 👤 <strong>{acceptingShare.sender_username}</strong></span>
                    </div>

                    <div className="form-group margin-top-16">
                      <label className="form-label"><FaCalendarAlt /> Choose Target Date for Your Daily List *</label>
                      <input
                        type="date"
                        className="form-input"
                        value={acceptTargetDate}
                        onChange={(e) => setAcceptTargetDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setAcceptingShare(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      ✅ Add to My Daily List (+15 Pts)
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Reject Modal with Mandatory Reason */}
          {rejectingShare && (
            <div className="modal-overlay" onClick={() => setRejectingShare(null)}>
              <div className="modal-content reject-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header modal-header-danger">
                  <h3><FaTimes /> Reject Shared Task Request</h3>
                  <button className="icon-btn" onClick={() => setRejectingShare(null)}>
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleConfirmRejectShare}>
                  <div className="modal-body">
                    <div className="reject-task-summary">
                      <h4>{rejectingShare.title}</h4>
                      <p>Sent by: 👤 <strong>{rejectingShare.sender_username}</strong></p>
                    </div>

                    <div className="form-group margin-top-16">
                      <label className="form-label"><FaExclamationTriangle /> Reason for Rejection * (Required)</label>
                      <textarea
                        className="form-textarea"
                        rows="3"
                        placeholder="e.g., Currently overloaded with 4 urgent IT server support tickets..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setRejectingShare(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-danger">
                      ❌ Send Rejection & Reason
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Complete Task Modal with Optional Completion Note */}
          {completingTodo && (
            <div className="modal-overlay" onClick={() => setCompletingTodo(null)}>
              <div className="modal-content accept-modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3><FaCheckSquare className="header-icon" /> Complete To-Do Task</h3>
                  <button className="icon-btn" onClick={() => setCompletingTodo(null)}>
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); executeToggleComplete(completingTodo.id, completionNote); }}>
                  <div className="modal-body">
                    <div className="accept-task-summary">
                      <h4>{completingTodo.title}</h4>
                      {completingTodo.description && <p>{completingTodo.description}</p>}
                    </div>

                    <div className="form-group margin-top-16">
                      <label className="form-label">Completion Note / Comments (Optional)</label>
                      <textarea
                        className="form-textarea"
                        rows="3"
                        placeholder="Add optional notes, outcome summary, or completion comments..."
                        value={completionNote}
                        onChange={(e) => setCompletionNote(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setCompletingTodo(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      ✅ Save & Mark Complete (+15 Pts)
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
