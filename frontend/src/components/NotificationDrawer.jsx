import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { showToastNotification } from "./NotificationToast";
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
  FaTimesCircle,
  FaVolumeMute,
  FaVolumeUp,
  FaDownload
} from "react-icons/fa";
import "./NotificationDrawer.css";

function NotificationDrawer({ isOpen, onClose, onNotificationRead }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // Toggle switch state stored in localStorage (default: true)
  const [isNotifEnabled, setIsNotifEnabled] = useState(() => {
    const saved = localStorage.getItem("taskpulse_notif_enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }

    // Capture PWA install prompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
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

  const handleToggleChange = async (e) => {
    const enabled = e.target.checked;
    setIsNotifEnabled(enabled);
    localStorage.setItem("taskpulse_notif_enabled", JSON.stringify(enabled));

    if (enabled) {
      showToastNotification("Notifications Enabled 🔔", "Real-time alerts active for tickets, todos & chat messages.", "success");
      
      if ("Notification" in window && Notification.permission === "default") {
        try {
          const perm = await Notification.requestPermission();
          if (perm === "granted" && 'serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
              await api.post("push-subscribe/", sub.toJSON()).catch(() => {});
            }
          }
        } catch (err) {
          console.log("Permission request handled silently:", err);
        }
      }
    } else {
      showToastNotification("Notifications Muted 🔕", "You can re-enable alerts anytime from this toggle.", "info");
    }
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        showToastNotification("TaskPulse App Installed 📱", "Check your phone home screen!", "success");
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Guide for iOS Safari or browsers without native beforeinstallprompt
      showToastNotification("Add to Home Screen 📱", "On iPhone: Tap Share ➔ Select 'Add to Home Screen'", "info");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("notifications/mark_all_read/");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      if (onNotificationRead) onNotificationRead();
      showToastNotification("Notifications Read ✅", "All notifications marked as read.", "success");
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
      showToastNotification("Cleared 🗑️", "Notification history cleared.", "info");
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

        {/* Global Notifications Toggle Switch Banner */}
        <div className="notif-toggle-shortcut-card">
          <div className="toggle-shortcut-left">
            {isNotifEnabled ? (
              <FaVolumeUp className="toggle-bell-icon active" />
            ) : (
              <FaVolumeMute className="toggle-bell-icon inactive" />
            )}
            <div>
              <strong>Alert Notifications</strong>
              <span className="toggle-status-text">
                {isNotifEnabled ? "Active & Real-Time ✓" : "Notifications Paused 🔕"}
              </span>
            </div>
          </div>
          <div className="toggle-switch-wrap">
            <label className="switch-toggle" title="Toggle Real-Time Notifications ON/OFF">
              <input 
                type="checkbox" 
                checked={isNotifEnabled} 
                onChange={handleToggleChange} 
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        {/* PWA Home Screen App Banner Shortcut */}
        {!isPwaInstalled && (
          <div className="pwa-install-banner" onClick={handleInstallPWA}>
            <div className="pwa-banner-left">
              <FaMobileAlt className="pwa-phone-icon" />
              <div>
                <strong>Add TaskPulse to Home Screen</strong>
                <span>Install mobile app for 1-tap access & push alerts</span>
              </div>
            </div>
            <button className="btn-install-pwa">
              <FaDownload /> Install App
            </button>
          </div>
        )}

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
            <div className="notif-loading">Loading notification history...</div>
          ) : filteredNotifs.length === 0 ? (
            <div className="notif-empty-state">
              <FaBell className="empty-bell-icon" />
              <p>No notifications yet</p>
              <span>Updates on Todos, Tickets & Chat will appear here</span>
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
