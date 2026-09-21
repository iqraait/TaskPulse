import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { 
  FaColumns, 
  FaTasks, 
  FaPlusCircle, 
  FaUsers, 
  FaChartLine, 
  FaSignOutAlt, 
  FaChevronLeft, 
  FaChevronRight,
  FaCheckSquare,
  FaTrophy
} from "react-icons/fa";
import "./Sidebar.css";

function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role || (user?.is_superuser ? 'superadmin' : 'staff');

  const navItems = [
    { path: "/dashboard", label: "Task Board", icon: FaColumns },
    { path: "/todos", label: "My Daily To-Do", icon: FaCheckSquare },
    { path: "/leaderboard", label: "Leaderboard & Rewards", icon: FaTrophy },
    { path: "/tasks", label: "Task Directory", icon: FaTasks },
    { path: "/create-task", label: "Create Task", icon: FaPlusCircle },
    { path: "/staff", label: "Staff Management", icon: FaUsers, superAdminOnly: true },
    { path: "/reports", label: "Reports & Stats", icon: FaChartLine },
  ];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-logo">
          <div className="logo-icon">T</div>
          {!collapsed && (
            <div className="brand-text">
              <span className="brand-name">TaskPulse</span>
              <span className="brand-tag">PRO SUITE</span>
            </div>
          )}
        </div>
        <button 
          className="collapse-btn" 
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav">
        <div className="nav-group-title">{!collapsed && "NAVIGATION"}</div>
        <ul>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`nav-link ${isActive ? "active" : ""}`}
                  title={collapsed ? item.label : ""}
                >
                  <Icon className="nav-icon" />
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {!collapsed && item.superAdminOnly && role === 'superadmin' && (
                    <span className="nav-dot-gold" title="Super Admin Area" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout} title="Sign Out">
          <FaSignOutAlt className="nav-icon" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;