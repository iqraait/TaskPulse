import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  FaTrophy, 
  FaCrown, 
  FaMedal, 
  FaStar, 
  FaTasks, 
  FaCheckSquare, 
  FaUserShield, 
  FaUser, 
  FaAward,
  FaFire,
  FaChartLine,
  FaShieldAlt
} from "react-icons/fa";
import "./Leaderboard.css";

function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await api.get("leaderboard/");
        setLeaderboard(res.data);
      } catch (err) {
        console.error("Fetch leaderboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const currentUserData = leaderboard.find(u => u.user_id === user?.id);

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return <span className="rank-badge rank-1"><FaCrown /> 1st Place</span>;
      case 2:
        return <span className="rank-badge rank-2"><FaMedal /> 2nd Place</span>;
      case 3:
        return <span className="rank-badge rank-3"><FaAward /> 3rd Place</span>;
      default:
        return <span className="rank-badge rank-num">#{rank}</span>;
    }
  };

  const isPureSuperAdmin = (user?.role === 'superadmin' || user?.is_superuser) && user?.role !== 'dept_admin';

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Navbar searchVal={searchVal} setSearchVal={setSearchVal} />

        <div className="page-container">
          
          {/* Top Banner */}
          <div className="leaderboard-header glass-card">
            <div className="header-text">
              <h2>
                <FaTrophy className="header-icon-gold" />{" "}
                {isPureSuperAdmin 
                  ? "Global Team Performance & Rewards Leaderboard" 
                  : `${user?.department || 'Department'} Team Performance & Rewards Leaderboard`}
              </h2>
              <p>
                {isPureSuperAdmin
                  ? "Global overview across all departments. Earn points by completing tasks and daily to-dos!"
                  : `Team performance view for ${user?.department || 'your department'}. Compete with department colleagues by resolving tasks & to-dos!`}
              </p>
            </div>

            {currentUserData && (
              <div className="my-rank-banner">
                <div className="my-rank-badge" style={{ borderColor: currentUserData.rank_color }}>
                  <span className="my-rank-pos">#{currentUserData.rank}</span>
                  <div className="my-rank-text">
                    <span className="my-rank-title">{currentUserData.level_name}</span>
                    <span className="my-rank-pts">{currentUserData.total_points} Total Points</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Leaderboard Table / Cards */}
          {loading ? (
            <div className="board-loading">Calculating team performance metrics...</div>
          ) : (
            <div className="leaderboard-wrapper glass-card">
              <div className="leaderboard-table-header">
                <span className="col-rank">Rank</span>
                <span className="col-staff">Staff Member</span>
                <span className="col-level">Performance Tier</span>
                <span className="col-tickets">Tickets Done</span>
                <span className="col-todos">To-Dos Done</span>
                <span className="col-pts">Total Points</span>
              </div>

              <div className="leaderboard-rows">
                {leaderboard.filter(item => {
                  if (isPureSuperAdmin) return true;
                  if (item.role === 'superadmin' || item.is_superuser) return false;
                  if (user?.department && item.department) {
                    return item.department.trim().toLowerCase() === user.department.trim().toLowerCase();
                  }
                  return true;
                }).map((item) => (
                  <div 
                    key={item.user_id} 
                    className={`leaderboard-row ${item.user_id === user?.id ? "highlight-me" : ""}`}
                  >
                    <div className="col-rank">
                      {getRankBadge(item.rank)}
                    </div>

                    <div className="col-staff">
                      <div className="staff-avatar-sm" style={{ background: item.rank_color }}>
                        {item.username ? item.username.substring(0, 2).toUpperCase() : "U"}
                      </div>
                      <div className="staff-name-block">
                        <strong className="staff-uname">
                          {item.username} {item.user_id === user?.id && <span className="me-pill">YOU</span>}
                        </strong>
                        <span className="staff-dept-str">{item.department} ({item.role})</span>
                      </div>
                    </div>

                    <div className="col-level">
                      <span className="level-pill-badge" style={{ borderColor: item.rank_color, color: item.rank_color }}>
                        {item.level_name}
                      </span>
                    </div>

                    <div className="col-tickets">
                      <span className="stat-num"><FaTasks className="stat-icon-task" /> {item.tasks_completed}</span>
                      <span className="stat-sub font-muted">({item.task_points} Pts)</span>
                    </div>

                    <div className="col-todos">
                      <span className="stat-num"><FaCheckSquare className="stat-icon-todo" /> {item.todos_completed}</span>
                      <span className="stat-sub font-muted">({item.todo_points} Pts)</span>
                    </div>

                    <div className="col-pts">
                      <div className="total-pts-badge" style={{ background: item.rank_color }}>
                        <FaFire /> {item.total_points} PTS
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Leaderboard;
