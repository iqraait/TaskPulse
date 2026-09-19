import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { 
  FaChartLine, 
  FaCheckCircle, 
  FaHourglassHalf, 
  FaSpinner, 
  FaExclamationTriangle, 
  FaBuilding, 
  FaUsers 
} from "react-icons/fa";
import "./Reports.css";

function Reports() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    progress: 0,
    done: 0,
    high_priority: 0,
    total_users: 0,
    department_stats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get("dashboard/stats/");
        setStats(res.data);
      } catch (err) {
        console.error("Fetch reports stats error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const completionPercentage = stats.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0;

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="page-container">
          <div className="reports-header glass-card">
            <div className="header-info">
              <h2><FaChartLine className="header-icon" /> Executive Reports & Analytics</h2>
              <p>Performance metrics, department workload distribution, and task completion analytics</p>
            </div>
          </div>

          {loading ? (
            <div className="board-loading">Loading report analytics...</div>
          ) : (
            <div className="reports-grid">
              {/* Overall Completion Metric Card */}
              <div className="report-card glass-card completion-card">
                <h3>Overall Task Completion Rate</h3>
                <div className="completion-ring-wrap">
                  <div className="progress-circle">
                    <span className="circle-val">{completionPercentage}%</span>
                    <span className="circle-sub">Tasks Done</span>
                  </div>
                </div>

                <div className="completion-breakdown">
                  <div className="breakdown-item">
                    <span className="dot dot-done"></span>
                    <span>Done: {stats.done}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="dot dot-progress"></span>
                    <span>In Progress: {stats.progress}</span>
                  </div>
                  <div className="breakdown-item">
                    <span className="dot dot-pending"></span>
                    <span>Pending: {stats.pending}</span>
                  </div>
                </div>
              </div>

              {/* Department Breakdown Card */}
              <div className="report-card glass-card dept-card">
                <h3><FaBuilding /> Department Task Workload</h3>
                <div className="dept-bars-list">
                  {stats.department_stats && stats.department_stats.length > 0 ? (
                    stats.department_stats.map((dept) => {
                      const percentage = stats.total > 0
                        ? Math.round((dept.count / stats.total) * 100)
                        : 0;
                      return (
                        <div key={dept.department} className="dept-bar-item">
                          <div className="dept-bar-label">
                            <span>{dept.department || "General"}</span>
                            <span className="dept-count">{dept.count} tasks ({percentage}%)</span>
                          </div>
                          <div className="progress-bar-bg">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="no-data">No department data available.</p>
                  )}
                </div>
              </div>

              {/* Status Summary & High Priority Highlights */}
              <div className="report-card glass-card summary-card">
                <h3>System Health Summary</h3>
                <div className="health-metrics-list">
                  <div className="health-item">
                    <div className="health-icon bg-total"><FaChartLine /></div>
                    <div className="health-text">
                      <span className="val">{stats.total}</span>
                      <span className="lbl">Total Active Tasks</span>
                    </div>
                  </div>

                  <div className="health-item">
                    <div className="health-icon bg-high"><FaExclamationTriangle /></div>
                    <div className="health-text">
                      <span className="val">{stats.high_priority}</span>
                      <span className="lbl">High Priority Tasks</span>
                    </div>
                  </div>

                  <div className="health-item">
                    <div className="health-icon bg-users"><FaUsers /></div>
                    <div className="health-text">
                      <span className="val">{stats.total_users}</span>
                      <span className="lbl">Registered Staff Members</span>
                    </div>
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

export default Reports;