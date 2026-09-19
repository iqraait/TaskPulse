import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaLock, FaUserCircle, FaEye, FaEyeSlash, FaArrowRight, FaApple, FaGoogle, FaCalendarAlt, FaUsers } from "react-icons/fa";
import heroImg from "../assets/login_team_hero.png";
import "./Login.css";

// Interactive daily events schedule dataset
const SCHEDULE_EVENTS = {
  22: {
    topTitle: "Task Review With Team",
    topTime: "09:30am - 10:30am",
    bottomTitle: "Design System Workshop",
    bottomTime: "02:00pm - 03:00pm",
    avatars: [
      { id: "JD", bg: "#f59e0b" },
      { id: "SK", bg: "#0284c7" },
      { id: "AL", bg: "#059669" }
    ]
  },
  23: {
    topTitle: "Task Review With Team",
    topTime: "09:30am - 10:30am",
    bottomTitle: "Daily Sprint Sync",
    bottomTime: "12:00pm - 01:00pm",
    avatars: [
      { id: "JD", bg: "#f59e0b" },
      { id: "SK", bg: "#0284c7" },
      { id: "AL", bg: "#059669" }
    ]
  },
  24: {
    topTitle: "Architecture Presentation",
    topTime: "11:00am - 12:30pm",
    bottomTitle: "Backend Code Review",
    bottomTime: "03:30pm - 04:30pm",
    avatars: [
      { id: "MR", bg: "#7e22ce" },
      { id: "SK", bg: "#0284c7" }
    ]
  },
  25: {
    topTitle: "Sprint Planning & Demo",
    topTime: "10:00am - 11:30am",
    bottomTitle: "QA Testing Workshop",
    bottomTime: "04:00pm - 05:00pm",
    avatars: [
      { id: "JD", bg: "#f59e0b" },
      { id: "AL", bg: "#059669" }
    ]
  },
  26: {
    topTitle: "Product Roadmap Huddle",
    topTime: "09:00am - 10:00am",
    bottomTitle: "Security Audit Check",
    bottomTime: "01:30pm - 02:30pm",
    avatars: [
      { id: "SK", bg: "#0284c7" },
      { id: "MR", bg: "#7e22ce" },
      { id: "JD", bg: "#f59e0b" }
    ]
  },
  27: {
    topTitle: "Weekly Retrospective",
    topTime: "04:00pm - 05:30pm",
    bottomTitle: "Team Happy Hour",
    bottomTime: "06:00pm - 07:00pm",
    avatars: [
      { id: "JD", bg: "#f59e0b" },
      { id: "SK", bg: "#0284c7" },
      { id: "AL", bg: "#059669" },
      { id: "MR", bg: "#7e22ce" }
    ]
  },
  28: {
    topTitle: "Weekend Standby Sync",
    topTime: "10:00am - 11:00am",
    bottomTitle: "DevOps Pipeline Check",
    bottomTime: "01:00pm - 02:00pm",
    avatars: [
      { id: "SK", bg: "#0284c7" }
    ]
  }
};

const CALENDAR_DAYS = [
  { dayName: "Sun", date: 22 },
  { dayName: "Mon", date: 23 },
  { dayName: "Tue", date: 24 },
  { dayName: "Wed", date: 25 },
  { dayName: "Thu", date: 26 },
  { dayName: "Fri", date: 27 },
  { dayName: "Sat", date: 28 },
];

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Interactive Calendar Active Day
  const [selectedDay, setSelectedDay] = useState(23);

  const activeSchedule = SCHEDULE_EVENTS[selectedDay] || SCHEDULE_EVENTS[23];

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

  return (
    <div className="login-attachment3-wrapper">
      {/* Big Split Glass Card (Attachment 3 Style) */}
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

        {/* Right Hero Image Panel with WORKING Interactive Calendar */}
        <div className="login-right-pane-big">
          <div className="hero-image-wrapper">
            <img src={heroImg} alt="Team Collaboration" className="hero-bg-img" />
            <div className="hero-overlay-gradient"></div>

            {/* Floating Widget 1: Top Task Review (Dynamic based on selected calendar day) */}
            <div className="floating-widget widget-top-big">
              <div className="widget-header-yellow">
                <span className="widget-title">{activeSchedule.topTitle}</span>
                <span className="widget-time">⏰ {activeSchedule.topTime}</span>
              </div>
            </div>

            {/* Floating Widget 2: WORKING Interactive Calendar Bar */}
            <div className="floating-widget widget-mid-calendar-big">
              <div className="cal-header-bar">
                <FaCalendarAlt className="cal-icon" /> Select Schedule Date:
              </div>
              <div className="cal-days-grid">
                {CALENDAR_DAYS.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    className={`cal-day-btn ${selectedDay === d.date ? "active" : ""}`}
                    onClick={() => setSelectedDay(d.date)}
                    title={`Click to view schedule for ${d.dayName} ${d.date}`}
                  >
                    <span className="day-label">{d.dayName}</span>
                    <strong className="date-label">{d.date}</strong>
                  </button>
                ))}
              </div>
            </div>

            {/* Floating Widget 3: Bottom Meeting Card (Dynamic based on selected calendar day) */}
            <div className="floating-widget widget-bottom-meeting-big">
              <span className="meeting-title">{activeSchedule.bottomTitle}</span>
              <span className="meeting-time">⏰ {activeSchedule.bottomTime}</span>
              <div className="avatar-stack">
                {activeSchedule.avatars.map((av, index) => (
                  <div key={index} className="av-circle" style={{ background: av.bg }}>
                    {av.id}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;