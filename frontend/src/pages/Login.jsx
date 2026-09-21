import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaLock,
  FaUserCircle,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaApple,
  FaGoogle,
  FaShieldAlt,
  FaBolt,
  FaUsers,
  FaChartBar,
  FaMoon,
  FaSun,
  FaGlobe,
  FaChevronDown,
  FaKey,
  FaEnvelope,
  FaTimes,
  FaCheckCircle,
  FaInfoCircle
} from "react-icons/fa";
import heroImg from "../assets/login_hero_team.png";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // UI preferences
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState("");
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

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
      console.error("Login error:", err);
      setErrorMsg(
        err.response?.data?.detail || "Invalid credentials. Please check your username and password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    setForgotLoading(true);
    setTimeout(() => {
      setForgotLoading(false);
      setForgotSubmitted(true);
    }, 800);
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setForgotSubmitted(false);
    setForgotInput("");
  };

  return (
    <div className={`sh-login-wrapper ${isDarkMode ? "sh-dark-mode-bg" : ""}`}>
      {/* Background ambient lighting accents */}
      <div className="sh-ambient-bg-glow glow-1"></div>
      <div className="sh-ambient-bg-glow glow-2"></div>
      <div className="sh-ambient-bg-glow glow-3"></div>

      {/* Main Screen-Fitted Card Container */}
      <div className={`sh-login-card ${isDarkMode ? "sh-card-dark" : ""}`}>
        
        {/* ================= LEFT VISUAL PANEL (TaskPulse Hero) ================= */}
        <div className="sh-left-pane">
          {/* Background image & overlay gradient */}
          <img src={heroImg} alt="TaskPulse Team" className="sh-hero-bg-img" />
          <div className="sh-hero-overlay"></div>

          {/* Bottom Watermark Script */}
          <div className="sh-watermark-bottom-script">
            Support Never Stops
          </div>

          {/* Top Brand Header */}
          <div className="sh-brand-header">
            <div className="sh-brand-icon-box">
              <span className="sh-brand-letter">T</span>
            </div>
            <div className="sh-brand-text">
              <h1 className="sh-brand-title">TaskPulse Pro</h1>
              <span className="sh-brand-tagline">TASK • TRACK • RESOLVE</span>
            </div>
          </div>

          {/* Center Main Headline & Subtitle */}
          <div className="sh-hero-content">
            <h2 className="sh-hero-headline">
              Great Teams Build <span className="sh-highlight-blue">Better Experiences</span>
            </h2>
            <p className="sh-hero-subtext">
              Raise tickets, track progress and get things done — all in one place.
            </p>

            {/* 3 Key Feature Pills */}
            <div className="sh-features-list">
              <div className="sh-feature-item">
                <div className="sh-feature-icon-pill">
                  <FaBolt />
                </div>
                <div className="sh-feature-text">
                  <strong>Quick Ticket Creation</strong>
                  <span>Report issues in seconds</span>
                </div>
              </div>

              <div className="sh-feature-item">
                <div className="sh-feature-icon-pill">
                  <FaUsers />
                </div>
                <div className="sh-feature-text">
                  <strong>Team Collaboration</strong>
                  <span>Work together, resolve faster</span>
                </div>
              </div>

              <div className="sh-feature-item">
                <div className="sh-feature-icon-pill">
                  <FaChartBar />
                </div>
                <div className="sh-feature-text">
                  <strong>Real-Time Tracking</strong>
                  <span>Stay updated always</span>
                </div>
              </div>
            </div>

            {/* Quote Box */}
            <div className="sh-quote-box">
              <span className="sh-quote-mark">“</span>
              <p className="sh-quote-text">
                Small issues resolved today create a <span className="sh-quote-highlight">better tomorrow.</span>
              </p>
            </div>
          </div>

          {/* Bottom Tags */}
          <div className="sh-left-footer-tags">
            <span>PEOPLE</span>
            <span className="sh-dot-sep">|</span>
            <span>PROCESS</span>
            <span className="sh-dot-sep">|</span>
            <span>PROGRESS</span>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL (Sign In) ================= */}
        <div className="sh-right-pane">
          
          {/* Top Controls: Dark Mode & Language Selector */}
          <div className="sh-top-controls">
            <div className="sh-controls-right">
              {/* Dark mode toggle */}
              <button
                type="button"
                className="sh-theme-toggle-btn"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <FaSun className="sh-icon-sun" /> : <FaMoon className="sh-icon-moon" />}
              </button>

              {/* Language selector */}
              <div className="sh-lang-dropdown-wrapper">
                <button
                  type="button"
                  className="sh-lang-btn"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                >
                  <FaGlobe className="sh-lang-icon" />
                  <span>{language}</span>
                  <FaChevronDown className="sh-chevron-icon" />
                </button>
                {showLangMenu && (
                  <div className="sh-lang-menu">
                    {["EN", "ES", "FR", "DE", "HI"].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        className={`sh-lang-option ${language === lang ? "active" : ""}`}
                        onClick={() => {
                          setLanguage(lang);
                          setShowLangMenu(false);
                        }}
                      >
                        {lang === "EN" ? "English (EN)" : lang === "ES" ? "Español (ES)" : lang === "FR" ? "Français (FR)" : lang === "DE" ? "Deutsch (DE)" : "Hindi (HI)"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Form Header */}
          <div className="sh-form-header">
            <h2 className="sh-welcome-title">Welcome Back</h2>
            <p className="sh-welcome-subtitle">
              Sign in to access your support command center & active tasks.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="sh-error-alert">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main Sign In Form */}
          <form onSubmit={handleLogin} className="sh-login-form">
            {/* Username Input Group */}
            <div className="sh-input-group">
              <label className="sh-input-label">Username</label>
              <div className="sh-input-wrapper">
                <FaUserCircle className="sh-input-icon" />
                <input
                  type="text"
                  className="sh-input-field"
                  placeholder="Enter your username (e.g. admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Input Group */}
            <div className="sh-input-group">
              <label className="sh-input-label">Password</label>
              <div className="sh-input-wrapper">
                <FaLock className="sh-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  className="sh-input-field sh-password-field"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="sh-toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Options Row: Keep signed in & Forgot Password */}
            <div className="sh-options-row">
              <label className="sh-checkbox-label">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="sh-checkbox"
                />
                <span className="sh-checkbox-custom"></span>
                <span className="sh-checkbox-text">Keep me signed in</span>
              </label>

              <button
                type="button"
                className="sh-forgot-link"
                onClick={() => setShowForgotModal(true)}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="sh-submit-btn"
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"} <FaArrowRight className="sh-btn-arrow" />
            </button>
          </form>

          {/* Divider */}
          <div className="sh-divider">
            <span className="sh-divider-text">or continue with</span>
          </div>

          {/* Social Sign In Buttons */}
          <div className="sh-social-grid">
            <button type="button" className="sh-social-btn">
              <FaGoogle className="sh-google-icon" />
              <span>Google</span>
            </button>

            <button type="button" className="sh-social-btn">
              <FaApple className="sh-apple-icon" />
              <span>Apple</span>
            </button>
          </div>

          {/* Security Alert Badge Footer */}
          <div className="sh-security-badge-box">
            <div className="sh-shield-icon-wrap">
              <FaShieldAlt className="sh-shield-icon" />
            </div>
            <div className="sh-security-text">
              <strong>Secure. Reliable. Always On.</strong>
              <p>Your data is protected with enterprise-grade security.</p>
            </div>
          </div>

        </div>

      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {showForgotModal && (
        <div className="sh-modal-overlay" onClick={closeForgotModal}>
          <div className="sh-modal-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="sh-modal-close-btn" onClick={closeForgotModal}>
              <FaTimes />
            </button>

            {!forgotSubmitted ? (
              <>
                <div className="sh-modal-header">
                  <div className="sh-modal-icon-badge">
                    <FaKey />
                  </div>
                  <h3>Forgot Password?</h3>
                  <p>
                    Enter your registered username or email address and we'll send you password reset instructions.
                  </p>
                </div>

                <form onSubmit={handleForgotSubmit} className="sh-modal-form">
                  <div className="sh-input-group">
                    <label className="sh-input-label">Username or Email</label>
                    <div className="sh-input-wrapper">
                      <FaEnvelope className="sh-input-icon" />
                      <input
                        type="text"
                        className="sh-input-field"
                        placeholder="Enter your username or email"
                        value={forgotInput}
                        onChange={(e) => setForgotInput(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="sh-modal-actions">
                    <button
                      type="button"
                      className="sh-modal-cancel-btn"
                      onClick={closeForgotModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="sh-modal-submit-btn"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? "Sending Link..." : "Send Reset Link"}
                    </button>
                  </div>
                </form>

                <div className="sh-modal-hint-box">
                  <FaInfoCircle />
                  <span>
                    Your reset request will be processed securely. Contact your workspace admin if you need immediate assistance.
                  </span>
                </div>
              </>
            ) : (
              <div className="sh-modal-success-state">
                <FaCheckCircle className="sh-success-check-icon" />
                <h3>Reset Link Sent!</h3>
                <p>
                  We have sent password reset instructions to <strong>{forgotInput || "your email/account"}</strong>. Please check your inbox or contact your workspace administrator.
                </p>
                <button
                  type="button"
                  className="sh-modal-done-btn"
                  onClick={closeForgotModal}
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default Login;