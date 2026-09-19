import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { FaLock, FaUserCircle, FaEye, FaEyeSlash, FaArrowRight, FaApple, FaGoogle, FaCalendarAlt, FaTasks, FaClock, FaCheckCircle, FaExclamationCircle, FaUser } from "react-icons/fa";
import heroImg from "../assets/login_team_hero.png";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Live ticket creation schedule from backend
  const [ticketSchedule, setTicketSchedule] = useState({});
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await api.get("public-schedule/");
        setTicketSchedule(res.data);
        const dates = Object.keys(res.data);
        if (dates.length > 0) {
          setSelectedDate(dates[0]);
        }
      } catch (err) {
        console.error("Fetch public ticket schedule error:", err);
      }
    };
    fetchSchedule();
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!username || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.detail || "Invalid credentials. Please check your username and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedDateTickets = ticketSchedule[selectedDate] || [];
  const primaryTicket = selectedDateTickets[0];
  const secondaryTicket = selectedDateTickets[1];

  const getStatusBadge = (st) => {
    switch (st) {
      case "pending":
        return <span className="badge badge-priority-medium">Pending</span>;
      case "progress":
        return <span className="badge badge-staff">In Progress</span>;
      case "done":
        return <span className="badge badge-admin">Completed</span>;
      case "closed":
        return <span className="badge" style={{background: '#cbd5e1', color: '#334155'}}>Closed</span>;
      default:
        return <span className="badge">{st}</span>;
    }
  };

  return (
    <div className="login-attachment3-wrapper">
      {/* Big Split Glass Card */}
      <div className="login-attachment3-card-big">
        {/* Left Form Section */}
        <div className="login-left-pane-big">
          {/* Top Pill Logo Badge */}
          <div className="brand-pill-badge-big">
            <span className="brand-pill-icon-big">T</span>
            <span className="brand-pill-name-big">TaskPulse Pro</span>
          </div>

          <div className="login-heading-group-big">
            <h2>Welcome back</h2>
            <p>Sign in to access your team command center & active tasks</p>
          </div>

          {errorMsg && <div className="login-error-alert">{errorMsg}</div>}

          <form onSubmit={handleLogin} className="login-form-attachment3-big">
            <div className="form-group-pill">
              <label className="form-label-pill">Username</label>
              <div className="input-pill-wrap">
                <FaUserCircle className="pill-input-icon-big" />
                <input
                  type="text"
                  className="input-pill-big"
                  placeholder="Enter your username (e.g. admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group-pill">
              <label className="form-label-pill">Password</label>
              <div className="input-pill-wrap">
                <FaLock className="pill-input-icon-big" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-pill-big"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-pw-pill-big"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-submit-gold-pill-big" disabled={loading}>
              {loading ? "Signing in..." : "Submit"} <FaArrowRight />
            </button>
          </form>

          {/* Social / Alternate Login Options */}
          <div className="social-pill-row-big">
            <button type="button" className="social-pill-btn-big">
              <FaApple /> Apple
            </button>
            <button type="button" className="social-pill-btn-big">
              <FaGoogle /> Google
            </button>
          </div>

          <div className="login-footer-pill-big">
            <span>Have an account? <a href="#login">Sign In</a></span>
            <span className="terms-link">Terms & Conditions</span>
          </div>
        </div>

        {/* Right Hero Image Panel with LIVE Ticket Created Dates Calendar */}
        <div className="login-right-pane-big">
          <div className="hero-image-wrapper">
            <img src={heroImg} alt="Team Collaboration" className="hero-bg-img" />
            <div className="hero-overlay-gradient"></div>

            {/* Floating Widget 1: Top Task Review (Dynamic based on selected creation date) */}
            <div className="floating-widget widget-top-big">
              <div className="widget-header-yellow">
                <span className="widget-title">
                  {primaryTicket ? `${primaryTicket.ticket_code}: ${primaryTicket.title}` : "System Ticket Activity Overview"}
                </span>
                <span className="widget-time">
                  {primaryTicket ? `👤 ${primaryTicket.assigned_to}` : "No tickets on date"}
                  {primaryTicket && getStatusBadge(primaryTicket.status)}
                </span>
              </div>
            </div>

            {/* Floating Widget 2: WORKING Interactive Ticket Creation Dates Calendar Bar */}
            <div className="floating-widget widget-mid-calendar-big">
              <div className="cal-header-bar">
                <FaCalendarAlt className="cal-icon" /> Ticket Creation Dates Preview:
              </div>
              <div className="cal-days-grid">
                {Object.keys(ticketSchedule).length > 0 ? (
                  Object.keys(ticketSchedule).map((dateStr) => {
                    const dateObj = new Date(dateStr);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    const pendingCount = ticketSchedule[dateStr].filter(t => t.status === 'pending' || t.status === 'progress').length;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        className={`cal-day-btn ${selectedDate === dateStr ? "active" : ""}`}
                        onClick={() => setSelectedDate(dateStr)}
                        title={`View ${pendingCount} pending/active tickets created on ${dateStr}`}
                      >
                        <span className="day-label">{dayName}</span>
                        <strong className="date-label">{dayNum}</strong>
                        {pendingCount > 0 && <span className="pending-dot-badge">{pendingCount}</span>}
                      </button>
                    );
                  })
                ) : (
                  <span className="no-dates-label">Loading ticket dates...</span>
                )}
              </div>
            </div>

            {/* Floating Widget 3: Bottom Secondary Ticket Card */}
            <div className="floating-widget widget-bottom-meeting-big">
              <span className="meeting-title">
                {secondaryTicket ? `${secondaryTicket.ticket_code}: ${secondaryTicket.title}` : (primaryTicket ? `Department: ${primaryTicket.department}` : "Select a date above to preview pending tickets")}
              </span>
              <span className="meeting-time">
                {secondaryTicket ? `Status: ${secondaryTicket.status.toUpperCase()} | Assigned: ${secondaryTicket.assigned_to}` : `Created Date: ${selectedDate || "Today"}`}
              </span>
              <div className="avatar-stack">
                <div className="av-circle" style={{ background: "#2563eb" }}>IT</div>
                <div className="av-circle" style={{ background: "#7e22ce" }}>HR</div>
                <div className="av-circle" style={{ background: "#059669" }}>FIN</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;