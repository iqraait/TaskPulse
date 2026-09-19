import { useState, useEffect } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { 
  FaTimes, 
  FaTrash, 
  FaPaperPlane, 
  FaUserCircle, 
  FaCalendarAlt, 
  FaBuilding, 
  FaExchangeAlt,
  FaCommentDots,
  FaCrown,
  FaUserShield,
  FaUser,
  FaTag,
  FaPaperclip,
  FaDownload,
  FaExternalLinkAlt,
  FaImage,
  FaFileAlt,
  FaHistory,
  FaUsers,
  FaArrowRight,
  FaFolderOpen,
  FaLock,
  FaUserEdit,
  FaCheckCircle
} from "react-icons/fa";
import "./TaskModal.css";

function TaskModal({ task, onClose, onRefresh, users = [] }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(task?.status || "pending");
  const [priority, setPriority] = useState(task?.priority || "low");
  const [category, setCategory] = useState(task?.category || "task");
  
  // Reassignment state
  const [newPrimary, setNewPrimary] = useState(task?.assigned_to || "");
  const [newSecondary, setNewSecondary] = useState(task?.assigned_to_secondary || "");
  const [showReassignPanel, setShowReassignPanel] = useState(false);
  
  const [comments, setComments] = useState(task?.comments || []);
  const [newComment, setNewComment] = useState("");
  const [newAttachment, setNewAttachment] = useState(null);
  const [saving, setSaving] = useState(false);

  const role = user?.role || (user?.is_superuser ? 'superadmin' : 'staff');
  const isAdmin = role === 'superadmin' || role === 'admin';
  const isAssignedStaff = task?.assigned_to === user?.id || task?.assigned_to_secondary === user?.id;
  
  // Permission logic:
  const canReassignOrUpdateStatus = isAdmin || isAssignedStaff;
  const canEditAdminFields = isAdmin;
  const canDelete = isAdmin;

  useEffect(() => {
    if (task) {
      setStatus(task.status);
      setPriority(task.priority);
      setCategory(task.category || "task");
      setNewPrimary(task.assigned_to || "");
      setNewSecondary(task.assigned_to_secondary || "");
      setComments(task.comments || []);
    }
  }, [task]);

  const isImageFile = (url) => {
    if (!url) return false;
    const cleanUrl = url.toLowerCase();
    return (
      cleanUrl.endsWith(".png") ||
      cleanUrl.endsWith(".jpg") ||
      cleanUrl.endsWith(".jpeg") ||
      cleanUrl.endsWith(".webp") ||
      cleanUrl.endsWith(".gif") ||
      cleanUrl.startsWith("data:image/")
    );
  };

  const getAttachmentUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:8000${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      if (newAttachment && canEditAdminFields) {
        const formData = new FormData();
        formData.append("status", status);
        formData.append("priority", priority);
        formData.append("category", category);
        if (newPrimary) formData.append("assigned_to", parseInt(newPrimary));
        if (newSecondary) formData.append("assigned_to_secondary", parseInt(newSecondary));
        else formData.append("assigned_to_secondary", "");
        formData.append("attachment", newAttachment);

        await api.patch(`tasks/${task.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.patch(`tasks/${task.id}/`, {
          status,
          priority: canEditAdminFields ? priority : task.priority,
          category: canEditAdminFields ? category : task.category,
          assigned_to: newPrimary ? parseInt(newPrimary) : null,
          assigned_to_secondary: newSecondary ? parseInt(newSecondary) : null
        });
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error("Update task error:", err);
      alert("Failed to update task.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ticket ${task.ticket_code || `#${task.id}`}?`)) {
      try {
        await api.delete(`tasks/${task.id}/`);
        onRefresh();
        onClose();
      } catch (err) {
        console.error("Delete task error:", err);
        alert("Failed to delete task.");
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post("comments/", {
        task: task.id,
        message: newComment
      });
      setComments([...comments, res.data]);
      setNewComment("");
      onRefresh();
    } catch (err) {
      console.error("Add comment error:", err);
      alert("Failed to post message.");
    }
  };

  const getUserBadge = (commentRole) => {
    if (commentRole === 'superadmin') {
      return <span className="badge badge-superadmin"><FaCrown style={{fontSize: '9px'}} /> Super Admin</span>;
    } else if (commentRole === 'admin') {
      return <span className="badge badge-admin"><FaUserShield style={{fontSize: '9px'}} /> Dept Admin</span>;
    }
    return <span className="badge badge-staff"><FaUser style={{fontSize: '9px'}} /> Staff</span>;
  };

  const getPriorityBadgeHeader = (p) => {
    switch (p) {
      case "high":
        return <span className="badge badge-priority-high">High Priority</span>;
      case "medium":
        return <span className="badge badge-priority-medium">Medium</span>;
      default:
        return <span className="badge badge-priority-low">Low Priority</span>;
    }
  };

  if (!task) return null;
  const fileUrl = getAttachmentUrl(task.attachment);
  const isImage = isImageFile(task.attachment);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-detail-modal-large" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header modal-header-enterprise">
          <div className="task-modal-header-left">
            <div className="header-badge-row">
              <span className="task-id-badge">{task.ticket_code || `#TK-${task.id}`}</span>
              <span className="dept-tag-header"><FaBuilding /> {task.department}</span>
              {getPriorityBadgeHeader(task.priority)}
            </div>
            <h2 className="modal-ticket-title">{task.title}</h2>
          </div>
          
          <button className="icon-close-btn" onClick={onClose} title="Close Modal">
            <FaTimes />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="modal-body modal-body-spacious">
          <div className="task-modal-grid-layout">
            
            {/* Left Column: Context, Locked Staff Display, Reassign Option & Audit History */}
            <div className="modal-column-left">
              
              {/* Description */}
              <div className="task-detail-block">
                <label className="block-label"><FaFolderOpen /> TICKET DESCRIPTION & CONTEXT</label>
                <div className="task-description-box">
                  {task.description || "No detailed description provided for this ticket."}
                </div>
              </div>

              {/* Locked Staff Assignees Display Cards */}
              <div className="task-detail-block">
                <div className="block-label-header-row">
                  <label className="block-label"><FaLock style={{color: '#64748b'}} /> CURRENT ASSIGNED STAFF (LOCKED DISPLAY)</label>
                  {canReassignOrUpdateStatus && (
                    <button 
                      type="button" 
                      className={`btn-reassign-toggle ${showReassignPanel ? 'active' : ''}`}
                      onClick={() => setShowReassignPanel(!showReassignPanel)}
                    >
                      <FaUserEdit /> {showReassignPanel ? "Close Reassign Panel" : "🔄 Reassign Ticket"}
                    </button>
                  )}
                </div>

                <div className="dual-staff-grid">
                  <div className="staff-assignee-card primary-staff-card locked-card">
                    <div className="card-top-status-row">
                      <span className="card-role-title">Primary Assignee</span>
                      <span className="locked-pill"><FaLock /> Locked</span>
                    </div>
                    <div className="staff-user-info">
                      <FaUserCircle className="staff-avatar-icon primary" />
                      <div className="staff-text-details">
                        <span className="staff-username-str">{task.assigned_to_username || "Unassigned"}</span>
                        <span className="staff-role-subtext">Lead Responsible Staff</span>
                      </div>
                    </div>
                  </div>

                  <div className="staff-assignee-card secondary-staff-card locked-card">
                    <div className="card-top-status-row">
                      <span className="card-role-title">Secondary Assignee</span>
                      <span className="locked-pill"><FaLock /> Locked</span>
                    </div>
                    <div className="staff-user-info">
                      <FaUsers className="staff-avatar-icon secondary" />
                      <div className="staff-text-details">
                        <span className="staff-username-str">{task.assigned_to_secondary_username || "None (Single Staff)"}</span>
                        <span className="staff-role-subtext">Assisting Staff Member</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dedicated Option to Reassign Staff */}
              {showReassignPanel && canReassignOrUpdateStatus && (
                <div className="reassign-action-panel glass-panel">
                  <div className="panel-title-row">
                    <h4><FaUserEdit /> Reassign Ticket to Staff Member</h4>
                    <span className="panel-subtitle">Select new staff assignees below to update handoff</span>
                  </div>

                  <div className="form-controls-grid">
                    <div className="form-group">
                      <label className="form-label"><FaUserCircle /> New Primary Assignee</label>
                      <select
                        className="form-select"
                        value={newPrimary}
                        onChange={(e) => setNewPrimary(e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            👤 {u.username} ({u.role || 'staff'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label"><FaUsers /> New Secondary Assignee</label>
                      <select
                        className="form-select"
                        value={newSecondary}
                        onChange={(e) => setNewSecondary(e.target.value)}
                      >
                        <option value="">None (Single Staff)</option>
                        {users.filter(u => u.id.toString() !== newPrimary?.toString()).map((u) => (
                          <option key={u.id} value={u.id}>
                            👥 {u.username} ({u.role || 'staff'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Clean Compact Audit Flow Log Timeline for Admins & Staff */}
              <div className="task-detail-block">
                <label className="block-label"><FaHistory /> TICKET REASSIGNMENT & LIFECYCLE AUDIT LOG</label>
                <div className="flow-timeline-container compact-flow-ui">
                  {task.flow_logs && task.flow_logs.length > 0 ? (
                    task.flow_logs.map((log, index) => (
                      <div key={log.id} className="mini-timeline-step">
                        <div className="step-badge-number">#{index + 1}</div>
                        <div className="mini-timeline-content">
                          <span className="log-action-str">{log.description}</span>
                          <span className="log-time-str">
                            {new Date(log.created_at).toLocaleDateString()} at {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="mini-timeline-step">
                      <div className="step-badge-number">#1</div>
                      <div className="mini-timeline-content">
                        <span className="log-action-str">
                          Ticket created by <strong>{task.created_by_username}</strong>. Initial assignment: <strong>{task.assigned_to_username}</strong>.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Media & Attachment Display */}
              <div className="task-detail-block">
                <label className="block-label"><FaPaperclip /> ATTACHED MEDIA & FILES</label>
                {task.attachment && fileUrl ? (
                  <div className="attachment-viewer-card">
                    {isImage ? (
                      <div className="attachment-image-wrap">
                        <img src={fileUrl} alt="Ticket Attachment" className="media-img-display" />
                        <div className="image-overlay-actions">
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                            <FaExternalLinkAlt /> Open Full View
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="attachment-file-wrap">
                        <div className="file-info-left">
                          <FaFileAlt className="file-icon-lg" />
                          <div>
                            <strong className="file-name-str">{task.attachment.split("/").pop()}</strong>
                            <span className="file-sub-str">Attached File Document</span>
                          </div>
                        </div>
                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" download className="btn btn-secondary btn-sm">
                          <FaDownload /> Download
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-attachment-notice">
                    <span>No files attached to this ticket yet.</span>
                  </div>
                )}

                {canEditAdminFields && (
                  <div className="attachment-upload-trigger">
                    <label htmlFor="modal-file-attach-input" className="btn btn-secondary btn-sm">
                      <FaPaperclip /> {task.attachment ? "Replace Attachment" : "Attach File"}
                    </label>
                    <input
                      type="file"
                      id="modal-file-attach-input"
                      style={{ display: "none" }}
                      onChange={(e) => setNewAttachment(e.target.files[0])}
                    />
                    {newAttachment && <span className="upload-ready-tag"><FaImage /> Ready: {newAttachment.name}</span>}
                  </div>
                )}
              </div>

              {/* Form Controls: Status & Priority */}
              <div className="form-controls-grid">
                <div className="form-group">
                  <label className="form-label"><FaExchangeAlt /> Ticket Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={!canReassignOrUpdateStatus}
                  >
                    <option value="pending">Pending (Orange)</option>
                    <option value="progress">In Progress (Blue)</option>
                    <option value="done">Done (Green)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Priority Level {!canEditAdminFields && <FaLock title="Locked by Admin" style={{fontSize: '11px', color: '#94a3b8'}} />}
                  </label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    disabled={!canEditAdminFields}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              {/* Footer Meta Row */}
              <div className="ticket-meta-footer">
                <span><FaBuilding /> Dept: <strong>{task.department}</strong></span>
                <span><FaCalendarAlt /> Created: <strong>{new Date(task.created_at).toLocaleDateString()}</strong></span>
                {task.due_date && <span>Target Due: <strong>{task.due_date}</strong></span>}
                <span>Author: <strong>{task.created_by_username}</strong></span>
              </div>

            </div>

            {/* Right Column: Chat Activity */}
            <div className="modal-column-right">
              <div className="chat-section-header">
                <FaCommentDots /> Ticket Chat & Activity ({comments.length})
              </div>

              <div className="chat-messages-container">
                {comments.length === 0 ? (
                  <p className="no-chat-msg">No discussion comments yet. Type a message below to start collaborating!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="chat-bubble-card">
                      <div className="chat-header-row">
                        <div className="chat-author-wrap">
                          <span className="author-title">{c.username || "User"}</span>
                          {getUserBadge(c.user_role)}
                        </div>
                        <span className="chat-timestamp">
                          {c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="chat-text-content">{c.message}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="chat-input-form">
                <input
                  type="text"
                  placeholder="Type a message or ticket update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" title="Send message">
                  <FaPaperPlane /> Send
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer modal-footer-enterprise">
          {canDelete && (
            <button className="btn btn-danger" onClick={handleDelete}>
              <FaTrash /> Delete Ticket
            </button>
          )}
          <div className="footer-right-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {canReassignOrUpdateStatus && (
              <button className="btn btn-primary" onClick={handleUpdate} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default TaskModal;
