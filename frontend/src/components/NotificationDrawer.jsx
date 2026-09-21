import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { 
  FaBell, 
  FaTimes, 
  FaCheckDouble, 
  FaTrashAlt, 
  FaTasks, 
  FaCheckSquare, 
  FaComment, 
  FaExclamationCircle, 
  FaMobileAlt, 
  FaChevronRight,
  FaShareAlt,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa";
import "./NotificationDrawer.css";

function NotificationDrawer({ isOpen, onClose, onNotificationRead }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [pushStatus, setPushStatus] = useState("default"); // default, granted, denied

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
    if ("Notification" in window) {
      setPushStatus(Notification.permission);
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get("notifications/");
      setNotifications(res.data);
    } catch (err) {
      console.error("Error loading notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("notifications/mark_all_read/");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (onNotificationRead) onNotificationRead();
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    try {
      await api.delete("notifications/clear_all/");
      setNotifications([]);
      if (onNotificationRead) onNotificationRead();
    } catch (err) {
      console.error("Error clearing notifications:", err);
    }
  };

  const handleItemClick = async (item) => {
    if (!item.is_read) {
      try {
        await api.post(`notifications/${item.id}/mark_read/`);
        setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, is_read: true } : n));
        if (onNotificationRead) onNotificationRead();
      } catch (err) {
        console.error("Error marking read:", err);
      }
    }
    onClose();
    if (item.link) {
      navigate(item.link);
    }
  };

  const requestMobilePush = async () => {
    if (!("Notification" in window)) {
      alert("Browser Push Notifications are not supported on this device/browser.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      if (permission === "granted") {
        new Notification("TaskPulse Alert 🚀", {
          body: "Mobile Push Notifications successfully activated! You will receive real-time ticket alerts.",
          icon: "/favicon.ico"
        });
        alert("🔔 Mobile Push Notifications Enabled!");
      } else {
        alert("Notification permission denied. Please enable notifications in your browser settings.");
      }
    } catch (err) {
      console.error("Push setup error:", err);
    }
  };

  const testMobilePush = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("TaskPulse Test Alert 🔔", {
        body: "Test notification is working smoothly on your device!",
        icon: "/favicon.ico"
      });
    } else {
      alert("🔔 TaskPulse Test Notification: Creating a Todo or Task now triggers real-time alerts!");
    }
  };

  const getNotifIcon = (type) => {
    switch (type) {
      case "todo_created":
        return <FaCheckSquare className="notif-type-icon notif-todo" />;
      case "todo_shared":
        return <FaShareAlt className="notif-type-icon notif-share" />;
      case "todo_accepted":
        return <FaCheckCircle className="notif-type-icon notif-success" />;
      case "todo_rejected":
        return <FaTimesCircle className="notif-type-icon notif-danger" />;
      case "task_created":
      case "task_assigned":
        return <FaTasks className="notif-type-icon notif-task" />;
      case "task_status":
      case "task_updated":
        return <FaExclamationCircle className="notif-type-icon notif-status" />;
      case "comment_added":
      case "chat_message":
        return <FaComment className="notif-type-icon notif-comment" />;
      default:
        return <FaBell className="notif-type-icon notif-default" />;
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  if (!isOpen) return null;

  const filteredNotifs = activeFilter === "unread" 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notif-drawer-overlay" onClick={onClose}>
      <div className="notif-drawer-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className="notif-drawer-header">
          <div className="notif-header-title">
            <FaBell className="header-bell-icon" />
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <span className="notif-unread-count-pill">{unreadCount} New</span>
            )}
          </div>
          <button className="notif-close-btn" onClick={onClose} title="Close">
            <FaTimes />
          </button>
        </div>

        {/* Mobile Push Quick Shortcut Banner */}
        <div className="notif-push-shortcut-card">
          <div className="push-shortcut-left">
            <FaMobileAlt className="push-mobile-icon" />
            <div>
              <strong>Mobile Push Alerts</strong>
              <span className="push-status-text">
                {pushStatus === "granted" ? "Active ✓" : "Inactive 🔔"}
              </span>
            </div>
          </div>
          <div className="push-shortcut-actions">
            {pushStatus !== "granted" ? (
              <button className="btn-enable-push" onClick={requestMobilePush}>
                Enable
              </button>
            ) : (
              <button className="btn-test-push" onClick={testMobilePush}>
                Test Alert
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs & Batch Actions */}
        <div className="notif-toolbar">
          <div className="notif-tabs">
            <button 
              className={`notif-tab ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All ({notifications.length})
            </button>
            <button 
              className={`notif-tab ${activeFilter === "unread" ? "active" : ""}`}
              onClick={() => setActiveFilter("unread")}
            >
              Unread ({unreadCount})
            </button>
          </div>

          <div className="notif-batch-actions">
            <button 
              className="btn-batch-action" 
              onClick={handleMarkAllRead}
              title="Mark all as read"
              disabled={unreadCount === 0}
            >
              <FaCheckDouble />
            </button>
            <button 
              className="btn-batch-action danger" 
              onClick={handleClearAll}
              title="Clear all notifications"
              disabled={notifications.length === 0}
            >
              <FaTrashAlt />
            </button>
          </div>
        </div>

        {/* Notification Items List */}
        <div className="notif-list-container">
          {loading ? (
            <div className="notif-loading">Loading notifications...</div>
          ) : filteredNotifs.length === 0 ? (
            <div className="notif-empty-state">
              <FaBell className="empty-bell-icon" />
              <p>No notifications found</p>
              <span>Activity updates on Todos, Tickets & Chat will appear here</span>
            </div>
          ) : (
            filteredNotifs.map((item) => (
              <div 
                key={item.id} 
                className={`notif-card-item ${!item.is_read ? "unread" : ""}`}
                onClick={() => handleItemClick(item)}
              >
                <div className="notif-icon-col">
                  {getNotifIcon(item.notification_type)}
                </div>
                <div className="notif-body-col">
                  <div className="notif-item-top">
                    <span className="notif-item-title">{item.title}</span>
                    <span className="notif-item-time">{formatTimeAgo(item.created_at)}</span>
                  </div>
                  <p className="notif-item-msg">{item.message}</p>
                </div>
                <div className="notif-arrow-col">
                  {!item.is_read && <span className="unread-blue-dot" />}
                  <FaChevronRight className="arrow-icon" />
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}

export default NotificationDrawer;
