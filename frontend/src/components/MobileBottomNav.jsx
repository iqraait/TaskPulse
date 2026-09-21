import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  FaColumns, 
  FaCheckSquare, 
  FaPlus, 
  FaTrophy, 
  FaBars, 
  FaTimes, 
  FaTasks, 
  FaPlusCircle, 
  FaUsers, 
  FaChartLine, 
  FaSignOutAlt,
  FaCrown,
  FaUserShield,
  FaUser,
  FaBell
} from "react-icons/fa";
import QuickCreateTodoModal from "./QuickCreateTodoModal";
import NotificationDrawer from "./NotificationDrawer";
import "./MobileBottomNav.css";

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDrawer, setShowDrawer] = useState(false);
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

  const handleLogout = () => {
    setShowDrawer(false);
    logout();
    navigate("/");
  };

  const navItems = [
    { path: "/dashboard", label: "Task Board", icon: FaColumns },
    { path: "/todos", label: "My Daily To-Do", icon: FaCheckSquare },
    { path: "/leaderboard", label: "Rewards & Ranks", icon: FaTrophy },
    { path: "/tasks", label: "Task Directory", icon: FaTasks },
    { path: "/create-task", label: "Create Ticket", icon: FaPlusCircle },
    { path: "/staff", label: "Staff Management", icon: FaUsers, superAdminOnly: true },
    { path: "/reports", label: "Reports & Stats", icon: FaChartLine },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="mobile-bottom-nav">
        <Link 
          to="/dashboard" 
          className={`mobile-nav-tab ${location.pathname === "/dashboard" ? "active" : ""}`}
        >
          <FaColumns className="tab-icon" />
          <span className="tab-label">Board</span>
        </Link>

        <Link 
          to="/todos" 
          className={`mobile-nav-tab ${location.pathname === "/todos" ? "active" : ""}`}
        >
          <FaCheckSquare className="tab-icon" />
          <span className="tab-label">To-Do</span>
        </Link>

        {/* Central Quick Action (+) Button */}
        <button 
          className="mobile-fab-btn" 
          onClick={() => setShowQuickTodo(true)}
          title="Quick Create Daily To-Do"
        >
          <FaPlus />
        </button>

        {/* Mobile Notification Bell Tab */}
        <button 
          className="mobile-nav-tab mobile-notif-tab"
          onClick={() => setShowNotifDrawer(true)}
          title="Notifications"
        >
          <div className="mobile-notif-icon-wrap">
            <FaBell className="tab-icon" />
            {unreadNotifCount > 0 && (
              <span className="mobile-notif-badge">{unreadNotifCount > 99 ? "99+" : unreadNotifCount}</span>
            )}
          </div>
          <span className="tab-label">Alerts</span>
        </button>

        <button 
          className={`mobile-nav-tab ${showDrawer ? "active" : ""}`}
          onClick={() => setShowDrawer(true)}
        >
          <FaBars className="tab-icon" />
          <span className="tab-label">Menu</span>
        </button>
      </div>

      {/* Slide-out Mobile Menu Drawer */}
      {showDrawer && (
        <div className="mobile-drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-user-info">
                <div className="user-avatar-circle">
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : "U"}
                </div>
                <div>
                  <h4 className="user-name">{user?.username}</h4>
                  <span className="user-role-badge">
                    {role === 'superadmin' ? <><FaCrown /> SuperAdmin</> : role === 'admin' ? <><FaUserShield /> DeptAdmin</> : <><FaUser /> Staff</>}
                  </span>
                </div>
              </div>
              <button className="drawer-close-btn" onClick={() => setShowDrawer(false)}>
                <FaTimes />
              </button>
            </div>

            {/* Notifications Shortcut Bar in Drawer */}
            <div className="mobile-drawer-notif-banner" onClick={() => { setShowDrawer(false); setShowNotifDrawer(true); }}>
              <div className="drawer-notif-left">
                <FaBell className="drawer-bell-icon" />
                <span>Notifications & Mobile Push Alerts</span>
              </div>
              {unreadNotifCount > 0 ? (
                <span className="drawer-notif-pill">{unreadNotifCount} New</span>
              ) : (
                <span className="drawer-notif-pill quiet">View</span>
              )}
            </div>

            {/* Navigation List */}
            <div className="mobile-drawer-nav">
              {navItems.map((item) => {
                if (item.superAdminOnly && role !== 'superadmin') return null;
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`drawer-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => setShowDrawer(false)}
                  >
                    <Icon className="drawer-icon" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Quick Create Button inside Drawer */}
            <div className="mobile-drawer-quick-action">
              <button 
                className="btn btn-primary btn-block btn-drawer-quick-todo"
                onClick={() => {
                  setShowDrawer(false);
                  setShowQuickTodo(true);
                }}
              >
                <FaPlus /> Quick Create Daily To-Do
              </button>
            </div>

            {/* Drawer Footer */}
            <div className="mobile-drawer-footer">
              <button className="btn btn-danger btn-block" onClick={handleLogout}>
                <FaSignOutAlt /> Sign Out
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Quick Create Daily To-Do Modal */}
      <QuickCreateTodoModal 
        isOpen={showQuickTodo}
        onClose={() => setShowQuickTodo(false)}
      />

      {/* Notification Drawer */}
      <NotificationDrawer 
        isOpen={showNotifDrawer}
        onClose={() => setShowNotifDrawer(false)}
        onNotificationRead={fetchUnreadCount}
      />
    </>
  );
}

export default MobileBottomNav;
