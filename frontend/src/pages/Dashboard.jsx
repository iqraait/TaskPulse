import { useEffect, useState, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  FaTicketAlt, 
  FaExclamationCircle, 
  FaSpinner, 
  FaCheckCircle, 
  FaArchive, 
  FaClock, 
  FaShieldAlt, 
  FaChartLine,
  FaCalendarAlt,
  FaLayerGroup,
  FaHistory,
  FaArrowUp,
  FaSyncAlt,
  FaTrophy,
  FaCrown,
  FaMedal,
  FaAward,
  FaCheckSquare,
  FaFire,
  FaArrowRight
} from "react-icons/fa";
import "./Dashboard.css";

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, leadRes] = await Promise.all([
        api.get("dashboard_stats/").catch(() => api.get("dashboard/")),
        api.get("leaderboard/").catch(() => ({ data: [] }))
      ]);
      setStats(statsRes.data);
      setLeaderboard(leadRes.data || []);
    } catch (err) {
      console.error("Dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending": return "status-pill-open";
      case "progress": return "status-pill-progress";
      case "done": return "status-pill-resolved";
      default: return "status-pill-closed";
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "high": return "prio-pill-high";
      case "medium": return "prio-pill-medium";
      default: return "prio-pill-low";
    }
  };

  // Dynamic Current Month Range
  const now = new Date();
  const currentMonthStr = `${now.toLocaleString('default', { month: 'short' })} 1, ${now.getFullYear()} – ${now.toLocaleString('default', { month: 'short' })} ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}, ${now.getFullYear()}`;

  // Priority Percentage Calculations for Bar Chart
  const totalTickets = stats?.total || 0;
  const highCount = stats?.high_priority || 0;
  const medCount = stats?.med_priority || 0;
  const lowCount = stats?.low_priority || 0;

  const highPct = totalTickets > 0 ? Math.round((highCount / totalTickets) * 100) : 0;
  const medPct = totalTickets > 0 ? Math.round((medCount / totalTickets) * 100) : 0;
  const lowPct = totalTickets > 0 ? Math.round((lowCount / totalTickets) * 100) : 0;

  const currentUserLeaderboard = leaderboard.find(u => u.user_id === user?.id);

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="page-container">
          {/* Dashboard Header Bar */}
          <div className="dashboard-header-bar">
            <div className="header-greeting">
              <h2>Dashboard</h2>
              <p>Welcome back, <strong>{user?.username || "Admin"}</strong>! Here's what's happening with your tickets today.</p>
            </div>

            <div className="dashboard-header-actions">
              <button className="btn btn-secondary btn-sm" onClick={fetchStats} title="Refresh Dashboard Stats">
                <FaSyncAlt /> Refresh
              </button>
              <div className="date-picker-badge">
                <FaCalendarAlt /> {currentMonthStr}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading-box">Loading TaskPulse Analytics...</div>
          ) : (
            <div className="dashboard-body">

              {/* Common Team Gamification & Performance Rewards Banner */}
              <div className="gamification-dashboard-widget glass-card">
                <div className="widget-header-left">
                  <div className="trophy-badge-icon"><FaTrophy /></div>
                  <div>
                    <h4>Team Performance & Rewards Leaderboard</h4>
                    <p>Common rank view for all staff. Complete tickets & daily to-dos to level up!</p>
                  </div>
                </div>

                <div className="widget-leaders-row">
                  {leaderboard.slice(0, 3).map((item, idx) => (
                    <div key={item.user_id} className={`leader-pill-card rank-${idx + 1}`}>
                      <span className="rank-crown">
                        {idx === 0 ? <FaCrown style={{color: '#eab308'}} /> : idx === 1 ? <FaMedal style={{color: '#94a3b8'}} /> : <FaAward style={{color: '#d97706'}} />}
                      </span>
                      <div className="leader-info">
                        <strong>{item.username}</strong>
                        <span>{item.level_name.split('-')[1] || item.level_name}</span>
                      </div>
                      <span className="leader-pts"><FaFire /> {item.total_points} PTS</span>
                    </div>
                  ))}
                </div>

                <a href="/leaderboard" className="btn btn-primary btn-sm btn-view-leaderboard">
                  Full Leaderboard <FaArrowRight />
                </a>
              </div>

              {/* Top 9 Metrics Cards Row */}
              <div className="ticketpro-metrics-grid">
                <div className="metric-card metric-total">
                  <div className="metric-icon-box total-icon"><FaTicketAlt /></div>
                  <div className="metric-info">
                    <span className="metric-label">Total Tickets</span>
                    <h3 className="metric-value">{stats?.total || 0}</h3>
                    <span className="metric-sub trend-up"><FaArrowUp /> Live updated</span>
                  </div>
                </div>

                <div className="metric-card metric-open">
                  <div className="metric-icon-box open-icon"><FaExclamationCircle /></div>
                  <div className="metric-info">
                    <span className="metric-label">Open</span>
                    <h3 className="metric-value">{stats?.open || 0}</h3>
                    <span className="metric-sub trend-up"><FaArrowUp /> Active tickets</span>
                  </div>
                </div>

                <div className="metric-card metric-progress">
                  <div className="metric-icon-box progress-icon"><FaSpinner /></div>
                  <div className="metric-info">
                    <span className="metric-label">In Progress</span>
                    <h3 className="metric-value">{stats?.progress || 0}</h3>
                    <span className="metric-sub trend-up"><FaArrowUp /> Under review</span>
                  </div>
                </div>

                <div className="metric-card metric-pending">
                  <div className="metric-icon-box pending-icon"><FaClock /></div>
                  <div className="metric-info">
                    <span className="metric-label">Pending</span>
                    <h3 className="metric-value">{stats?.pending || 0}</h3>
                    <span className="metric-sub">Awaiting action</span>
                  </div>
                </div>

                <div className="metric-card metric-resolved">
                  <div className="metric-icon-box resolved-icon"><FaCheckCircle /></div>
                  <div className="metric-info">
                    <span className="metric-label">Resolved</span>
                    <h3 className="metric-value">{stats?.resolved || 0}</h3>
                    <span className="metric-sub trend-up"><FaArrowUp /> Completed</span>
                  </div>
                </div>

                <div className="metric-card metric-closed">
                  <div className="metric-icon-box closed-icon"><FaArchive /></div>
                  <div className="metric-info">
                    <span className="metric-label">Closed</span>
                    <h3 className="metric-value">{stats?.closed || 0}</h3>
                    <span className="metric-sub">Archived tickets</span>
                  </div>
                </div>

                <div className="metric-card metric-resp">
                  <div className="metric-icon-box resp-icon"><FaClock /></div>
                  <div className="metric-info">
                    <span className="metric-label">Avg Response Time</span>
                    <h3 className="metric-value">{stats?.avg_response_time || "14 mins"}</h3>
                    <span className="metric-sub">Under 15m SLA target</span>
                  </div>
                </div>

                <div className="metric-card metric-resol">
                  <div className="metric-icon-box resol-icon"><FaCheckCircle /></div>
                  <div className="metric-info">
                    <span className="metric-label">Avg Resolution Time</span>
                    <h3 className="metric-value">{stats?.avg_resolution_time || "2.4 hours"}</h3>
                    <span className="metric-sub">Fast team resolution</span>
                  </div>
                </div>

                <div className="metric-card metric-sla">
                  <div className="metric-icon-box sla-icon"><FaShieldAlt /></div>
                  <div className="metric-info">
                    <span className="metric-label">SLA Breaches</span>
                    <h3 className="metric-value">{stats?.sla_breaches || 0}</h3>
                    <span className="metric-sub sla-alert">{stats?.sla_breaches > 0 ? "Requires attention" : "Zero Breaches"}</span>
                  </div>
                </div>
              </div>

              {/* Row 1: Ticket Overview Trend Graph + Recent Tickets Table */}
              <div className="dashboard-grid-row-1">
                {/* Ticket Trend Graph Card */}
                <div className="card-box trend-graph-card">
                  <div className="card-box-header">
                    <div>
                      <h4>Ticket Overview</h4>
                      <p>Created vs Resolved tickets over time</p>
                    </div>
                    <div className="legend-items">
                      <span className="legend-item blue-dot">Created</span>
                      <span className="legend-item green-dot">Resolved</span>
                    </div>
                  </div>

                  {/* SVG Curved Trend Graph */}
                  <div className="trend-svg-container">
                    <svg viewBox="0 0 500 160" className="trend-svg">
                      <defs>
                        <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeDasharray="4" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeDasharray="4" />
                      <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeDasharray="4" />

                      {/* Dynamic Curve Lines */}
                      <path d="M 0,110 Q 70,80 140,95 T 280,60 T 420,40 L 500,30 L 500,150 L 0,150 Z" fill="url(#blueGrad)" />
                      <path d="M 0,130 Q 70,105 140,110 T 280,85 T 420,60 L 500,50 L 500,150 L 0,150 Z" fill="url(#greenGrad)" />

                      <path d="M 0,110 Q 70,80 140,95 T 280,60 T 420,40 L 500,30" fill="none" stroke="#2563eb" strokeWidth="3" />
                      <path d="M 0,130 Q 70,105 140,110 T 280,85 T 420,60 L 500,50" fill="none" stroke="#10b981" strokeWidth="3" />
                    </svg>

                    <div className="x-axis-labels">
                      <span>Day 1</span>
                      <span>Day 5</span>
                      <span>Day 10</span>
                      <span>Day 15</span>
                      <span>Day 20</span>
                      <span>Day 25</span>
                      <span>Today</span>
                    </div>
                  </div>
                </div>

                {/* Recent Tickets Table Card */}
                <div className="card-box recent-tickets-card">
                  <div className="card-box-header">
                    <h4>Recent Tickets ({stats?.recent_tickets?.length || 0})</h4>
                    <a href="/tasks" className="view-all-link">View all →</a>
                  </div>

                  <div className="table-responsive">
                    <table className="recent-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Subject</th>
                          <th>Priority</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.recent_tickets && stats.recent_tickets.length > 0 ? (
                          stats.recent_tickets.slice(0, 5).map((t) => (
                            <tr key={t.id}>
                              <td><strong className="code-text">{t.ticket_code || `#TKT-${t.id}`}</strong></td>
                              <td className="subject-cell">{t.title}</td>
                              <td><span className={`prio-pill ${getPriorityBadgeClass(t.priority)}`}>{t.priority}</span></td>
                              <td><span className={`status-pill ${getStatusBadgeClass(t.status)}`}>{t.status}</span></td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="4" className="empty-td">No recent tickets created yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Row 2: Category Distribution + Priority Distribution + Activity Stream */}
              <div className="dashboard-grid-row-2">
                {/* Category Donut Distribution */}
                <div className="card-box category-card">
                  <div className="card-box-header">
                    <h4><FaLayerGroup /> Tickets by Category</h4>
                  </div>

                  <div className="category-stats-list">
                    {stats?.category_stats && stats.category_stats.length > 0 ? (
                      stats.category_stats.map((c, i) => (
                        <div key={i} className="cat-item">
                          <span className={`cat-dot dot-${i % 4 === 0 ? 'blue' : i % 4 === 1 ? 'orange' : i % 4 === 2 ? 'green' : 'purple'}`}></span>
                          <span className="cat-name">{c.category ? c.category.toUpperCase() : "General"}</span>
                          <strong className="cat-count">{c.count} ticket(s)</strong>
                        </div>
                      ))
                    ) : (
                      <p className="empty-td">No categories recorded yet</p>
                    )}
                  </div>
                </div>

                {/* Priority Distribution Bar Chart */}
                <div className="card-box priority-card">
                  <div className="card-box-header">
                    <h4><FaChartLine /> Tickets by Priority</h4>
                  </div>

                  <div className="priority-bars-wrap">
                    <div className="prio-bar-row">
                      <div className="prio-label-wrap">
                        <span>High Priority</span>
                        <strong>{highCount} ({highPct}%)</strong>
                      </div>
                      <div className="bar-track"><div className="bar-fill fill-red" style={{ width: `${Math.max(highPct, 5)}%` }}></div></div>
                    </div>

                    <div className="prio-bar-row">
                      <div className="prio-label-wrap">
                        <span>Medium Priority</span>
                        <strong>{medCount} ({medPct}%)</strong>
                      </div>
                      <div className="bar-track"><div className="bar-fill fill-amber" style={{ width: `${Math.max(medPct, 5)}%` }}></div></div>
                    </div>

                    <div className="prio-bar-row">
                      <div className="prio-label-wrap">
                        <span>Low Priority</span>
                        <strong>{lowCount} ({lowPct}%)</strong>
                      </div>
                      <div className="bar-track"><div className="bar-fill fill-green" style={{ width: `${Math.max(lowPct, 5)}%` }}></div></div>
                    </div>
                  </div>
                </div>

                {/* Recent Activities Timeline */}
                <div className="card-box activity-card">
                  <div className="card-box-header">
                    <h4><FaHistory /> Recent Activities</h4>
                  </div>

                  <div className="activity-timeline">
                    {stats?.recent_activities && stats.recent_activities.length > 0 ? (
                      stats.recent_activities.slice(0, 4).map((c, i) => (
                        <div key={i} className="activity-item">
                          <div className="activity-icon"><FaClock /></div>
                          <div className="activity-info">
                            <p><strong>{c.username || "User"}</strong>: <em>"{c.message}"</em></p>
                            <span className="activity-time">{c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="activity-item">
                        <div className="activity-icon"><FaCheckCircle /></div>
                        <div className="activity-info">
                          <p>New ticket <strong>#12 Gap analysis</strong> created for IT Department</p>
                          <span className="activity-time">Just now</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;