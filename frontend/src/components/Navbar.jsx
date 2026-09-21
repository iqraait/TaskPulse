import { useState, useEffect } from "react";
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
  FaPlus
} from "react-icons/fa";
import DepartmentChatModal from "./DepartmentChatModal";
import QuickCreateTodoModal from "./QuickCreateTodoModal";
import NotificationDrawer from "./NotificationDrawer";
import NotificationToast from "./NotificationToast";
import "./Navbar.css";

function Navbar({ searchVal = "", setSearchVal = () => {} }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showChatModal, setShowChatModal] = useState(false);
  const [showQuickTodo, setShowQuickTodo] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const role = user?.role || (user?.is_superuser ? 'superadmin' : 'staff');

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 12000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get("notifications/unread_count/");
      if (res.data && typeof res.data.unread_count === "number") {
        setUnreadNotifCount(res.data.unread_count);
      }
    } catch (err) {
      console.error("Error fetching unread notif count:", err);
    }
  };

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

  return (
    <header className="navbar-container">
      {/* Toast Notification Container */}
      <NotificationToast />

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
        {/* Quick Create Daily To-Do Action Button */}
        <button 
          className="btn btn-primary btn-sm quick-todo-nav-btn"
          onClick={() => setShowQuickTodo(true)}
          title="Quick Add Daily To-Do"
        >
          <FaPlus style={{ fontSize: '11px' }} />
          <span>+ Quick To-Do</span>
        </button>

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

        {/* Notifications Icon (Opens Notification Drawer) */}
        <button 
          className="icon-btn notif-bell-btn" 
          onClick={() => setShowNotifDrawer(true)}
          title="Open Notifications"
        >
          <FaBell />
          {unreadNotifCount > 0 && (
            <span className="notif-badge">{unreadNotifCount > 99 ? "99+" : unreadNotifCount}</span>
          )}
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

      {/* Quick Create Daily To-Do Modal */}
      <QuickCreateTodoModal
        isOpen={showQuickTodo}
        onClose={() => setShowQuickTodo(false)}
      />

      {/* Notification Center Drawer */}
      <NotificationDrawer 
        isOpen={showNotifDrawer} 
        onClose={() => setShowNotifDrawer(false)}
        onNotificationRead={fetchUnreadCount}
      />
    </header>
  );
}

export default Navbar;