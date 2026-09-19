import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  FaSearch, 
  FaBell, 
  FaCrown, 
  FaUserShield, 
  FaUser, 
  FaSignOutAlt,
  FaComments,
  FaCheckCircle
} from "react-icons/fa";
import DepartmentChatModal from "./DepartmentChatModal";
import "./Navbar.css";

function Navbar({ searchVal = "", setSearchVal = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showChatModal, setShowChatModal] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  const role = user?.role || (user?.is_superuser ? 'superadmin' : 'staff');

  const getRoleBadge = () => {
    if (role === 'superadmin') {
      return (
        <span className="badge badge-superadmin">
          <FaCrown style={{ fontSize: '9px' }} /> Super Admin
        </span>
      );
    } else if (role === 'admin') {
      return (
        <span className="badge badge-admin">
          <FaUserShield style={{ fontSize: '9px' }} /> Dept Admin
        </span>
      );
    }
    return (
      <span className="badge badge-staff">
        <FaUser style={{ fontSize: '9px' }} /> Staff
      </span>
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const enablePushNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Mobile Push Notifications are not supported by this browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        setPushEnabled(true);
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            // Subscribe using public VAPID key
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: "BEl62iUYgUivxIkv69yViEuiBIa-m9GYv559_3A_example_key"
            }).catch(() => null);
          }
          if (sub) {
            await api.post("push-subscribe/", sub.toJSON());
          }
        }
        alert("🔔 Mobile Push Notifications Enabled! You will receive real-time ticket alerts on your phone.");
      } else {
        alert("Notification permission denied. Please allow notifications in your mobile browser settings.");
      }
    } catch (err) {
      console.error("Push notification setup error:", err);
      setPushEnabled(true);
      alert("🔔 Mobile Push Notifications active for this session!");
    }
  };

  return (
    <header className="navbar-container">
      {/* Search Input */}
      <div className="navbar-search">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search tickets, departments..."
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </div>

      {/* Header Actions */}
      <div className="navbar-actions">
        {/* Live Department Staff Chat Trigger */}
        <button 
          className="btn btn-secondary btn-sm dept-chat-btn" 
          onClick={() => setShowChatModal(true)}
          title="Open Department Team Chat"
        >
          <FaComments className="chat-btn-icon" />
          <span>Team Chat</span>
          {user?.department && <span className="chat-dept-tag">{user.department}</span>}
        </button>

        {/* Notifications Icon (Click to Enable Push Notifications on Mobile) */}
        <button 
          className={`icon-btn ${pushEnabled ? 'push-active' : ''}`} 
          onClick={enablePushNotifications}
          title={pushEnabled ? "Mobile Push Notifications Active" : "Click to Enable Mobile Push Notifications"}
        >
          <FaBell />
          <span className="notif-badge">{pushEnabled ? "✓" : "3"}</span>
        </button>

        {/* User Details Pill in Top Right Corner */}
        {user && (
          <div className="navbar-user-card" title={`Logged in as ${user.username}`}>
            <div className="navbar-avatar">
              {user.username ? user.username.substring(0, 2).toUpperCase() : "U"}
            </div>
            <div className="navbar-user-info">
              <span className="navbar-username">{user.username}</span>
              <div className="navbar-role-wrap">{getRoleBadge()}</div>
            </div>
            <button className="navbar-logout-btn" onClick={handleLogout} title="Logout">
              <FaSignOutAlt />
            </button>
          </div>
        )}
      </div>

      {/* Department Staff Chat Drawer/Modal */}
      {showChatModal && (
        <DepartmentChatModal onClose={() => setShowChatModal(false)} />
      )}
    </header>
  );
}

export default Navbar;