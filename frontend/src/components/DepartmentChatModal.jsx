import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { FaComments, FaTimes, FaPaperPlane, FaCrown, FaUserShield, FaUser, FaBuilding } from "react-icons/fa";
import "./DepartmentChat.css";

function DepartmentChatModal({ onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const deptName = user?.department || "General Team";
  const role = user?.role || (user?.is_superuser ? 'superadmin' : 'staff');

  const fetchMessages = async () => {
    try {
      // Use existing comments endpoint or general department chat comments
      const res = await api.get("comments/");
      setMessages(res.data);
    } catch (err) {
      console.error("Fetch department chat messages error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // Polling for team chat
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      // Send comment attached to general ticket or task
      const firstTaskRes = await api.get("tasks/");
      const targetTaskId = firstTaskRes.data.length > 0 ? firstTaskRes.data[0].id : 1;

      const res = await api.post("comments/", {
        task: targetTaskId,
        message: text
      });

      setMessages([...messages, res.data]);
      setText("");
    } catch (err) {
      console.error("Send department chat error:", err);
    }
  };

  const getUserBadge = (cRole) => {
    if (cRole === 'superadmin') {
      return <span className="badge badge-superadmin"><FaCrown style={{fontSize: '9px'}} /> Super Admin</span>;
    } else if (cRole === 'admin') {
      return <span className="badge badge-admin"><FaUserShield style={{fontSize: '9px'}} /> Dept Admin</span>;
    }
    return <span className="badge badge-staff"><FaUser style={{fontSize: '9px'}} /> Staff</span>;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content chat-drawer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="chat-modal-title">
            <FaComments className="chat-modal-icon" />
            <div>
              <h3>Department Staff Chat</h3>
              <p className="chat-dept-subtitle"><FaBuilding /> {deptName}</p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body chat-modal-body">
          {loading ? (
            <div className="chat-loading">Loading department chat messages...</div>
          ) : (
            <div className="chat-messages-container">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <p>No messages in {deptName} channel yet. Be the first to start the conversation!</p>
                </div>
              ) : (
                messages.map((m) => (
                  <div 
                    key={m.id} 
                    className={`chat-bubble-item ${m.username === user?.username ? "my-message" : ""}`}
                  >
                    <div className="chat-bubble-header">
                      <span className="chat-author-name">{m.username || "Staff Member"}</span>
                      {getUserBadge(m.user_role)}
                      <span className="chat-time">
                        {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="chat-bubble-body">{m.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="modal-footer chat-modal-footer">
          <input
            type="text"
            className="form-input chat-input"
            placeholder={`Type a message to ${deptName} team...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            <FaPaperPlane /> Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default DepartmentChatModal;
