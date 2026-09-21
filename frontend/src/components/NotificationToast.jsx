import { useState, useEffect } from "react";
import { FaBell, FaTimes } from "react-icons/fa";
import "./NotificationToast.css";

let toastTrigger = null;

export const showToastNotification = (title, message, type = "info") => {
  if (toastTrigger) {
    toastTrigger(title, message, type);
  }
};

export function NotificationToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    toastTrigger = (title, message, type) => {
      setToast({ title, message, type });
      setTimeout(() => {
        setToast(null);
      }, 4500);
    };
    return () => {
      toastTrigger = null;
    };
  }, []);

  if (!toast) return null;

  return (
    <div className={`toast-notification-popup toast-${toast.type}`}>
      <div className="toast-icon-wrap">
        <FaBell />
      </div>
      <div className="toast-content-wrap">
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
      </div>
      <button className="toast-close-btn" onClick={() => setToast(null)}>
        <FaTimes />
      </button>
    </div>
  );
}

export default NotificationToast;
