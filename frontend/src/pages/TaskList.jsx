import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import TaskModal from "../components/kanban/TaskModal";
import api from "../services/api";
import { 
  FaTasks, 
  FaSearch, 
  FaFilter, 
  FaUserCircle, 
  FaCalendarAlt, 
  FaExternalLinkAlt,
  FaUserCheck,
  FaCalendarWeek,
  FaExchangeAlt,
  FaHistory
} from "react-icons/fa";
import "./TaskList.css";

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchVal, setSearchVal] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [reassignedFilter, setReassignedFilter] = useState("all");
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("tasks/");
      setTasks(res.data);
    } catch (err) {
      console.error("Fetch task list error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("users/");
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [fetchTasks, fetchUsers]);

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchVal ||
      t.title.toLowerCase().includes(searchVal.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchVal.toLowerCase())) ||
      (t.department && t.department.toLowerCase().includes(searchVal.toLowerCase())) ||
      (t.ticket_code && t.ticket_code.toLowerCase().includes(searchVal.toLowerCase()));

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;

    // Filter by Reassigned status
    let matchesReassigned = true;
    if (reassignedFilter === "reassigned") {
      matchesReassigned = t.is_reassigned === true;
    } else if (reassignedFilter === "original") {
      matchesReassigned = !t.is_reassigned;
    }

    // Filter by Assignee
    let matchesAssignee = true;
    if (assigneeFilter === "unassigned") {
      matchesAssignee = !t.assigned_to && !t.assigned_to_secondary;
    } else if (assigneeFilter !== "all") {
      matchesAssignee =
        (t.assigned_to && t.assigned_to.toString() === assigneeFilter) ||
        (t.assigned_to_secondary && t.assigned_to_secondary.toString() === assigneeFilter);
    }

    // Filter by Date / Timeframe
    let matchesDate = true;
    if (dateFilter !== "all" && t.created_at) {
      const taskDate = new Date(t.created_at);
      const now = new Date();

      if (dateFilter === "today") {
        matchesDate = taskDate.toDateString() === now.toDateString();
      } else if (dateFilter === "this_week") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesDate = taskDate >= sevenDaysAgo;
      } else if (dateFilter === "this_month") {
        matchesDate =
          taskDate.getMonth() === now.getMonth() &&
          taskDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesDate && matchesReassigned;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="badge badge-priority-medium">Pending</span>;
      case "progress":
        return <span className="badge badge-staff">In Progress</span>;
      case "done":
        return <span className="badge badge-admin">Completed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <span className="badge badge-priority-high">High</span>;
      case "medium":
        return <span className="badge badge-priority-medium">Medium</span>;
      default:
        return <span className="badge badge-priority-low">Low</span>;
    }
  };

  const formatAssignees = (task) => {
    const primary = task.assigned_to_username;
    const secondary = task.assigned_to_secondary_username;
    if (primary && secondary && primary !== "Unassigned") return `${primary} & ${secondary}`;
    if (primary && primary !== "Unassigned") return primary;
    if (secondary) return secondary;
    return "Unassigned";
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Navbar searchVal={searchVal} setSearchVal={setSearchVal} />

        <div className="page-container">
          <div className="task-list-header glass-card">
            <div className="header-info">
              <h2><FaTasks className="header-icon" /> Task Directory</h2>
              <p>Filter by staff assignees, reassignment status, date ranges, and priority</p>
            </div>

            {/* Filters Toolbar */}
            <div className="list-filters-wrapper">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search title, ticket #..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                />
              </div>

              {/* Filter by Reassignment */}
              <select
                className="form-select filter-select filter-reassigned-select"
                value={reassignedFilter}
                onChange={(e) => setReassignedFilter(e.target.value)}
              >
                <option value="all">🔄 All Flow Types</option>
                <option value="reassigned">💜 Reassigned Tasks Only</option>
                <option value="original">📌 Original / Direct Tasks</option>
              </select>

              {/* Filter by Assignee */}
              <select
                className="form-select filter-select"
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
              >
                <option value="all">👥 All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id.toString()}>
                    👤 {u.username} ({u.role || 'staff'})
                  </option>
                ))}
              </select>

              {/* Filter by Date Range */}
              <select
                className="form-select filter-select"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">📅 All Time</option>
                <option value="today">📅 Today</option>
                <option value="this_week">📅 This Week</option>
                <option value="this_month">🗓️ This Month</option>
              </select>

              {/* Filter by Status */}
              <select
                className="form-select filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="progress">In Progress</option>
                <option value="done">Done</option>
              </select>

              {/* Filter by Priority */}
              <select
                className="form-select filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="task-table-container glass-card">
            {loading ? (
              <div className="board-loading">Loading tasks...</div>
            ) : filteredTasks.length === 0 ? (
              <div className="empty-column-placeholder">No matching tasks found</div>
            ) : (
              <table className="task-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Task Name</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Assigned Staff</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => (
                    <tr 
                      key={t.id} 
                      onClick={() => setSelectedTask(t)}
                      className={t.is_reassigned ? "row-reassigned-task" : ""}
                    >
                      <td>
                        <span className={`task-id-tag ${t.is_reassigned ? 'tag-reassigned' : ''}`}>
                          {t.ticket_code || `#${t.id}`}
                        </span>
                      </td>
                      <td className="task-title-cell">
                        <div className="title-cell-wrap">
                          <span className="title-text">{t.title}</span>
                          {t.is_reassigned && (
                            <span className="badge badge-reassigned-purple">
                              <FaExchangeAlt /> Reassigned
                            </span>
                          )}
                        </div>
                      </td>
                      <td><span className="dept-pill">{t.department}</span></td>
                      <td>{getStatusBadge(t.status)}</td>
                      <td>{getPriorityBadge(t.priority)}</td>
                      <td>
                        <span className={`assignee-pill ${t.is_reassigned ? 'assignee-reassigned-purple' : ''}`}>
                          <FaUserCircle /> {formatAssignees(t)}
                        </span>
                      </td>
                      <td>
                        <span className="date-pill">
                          <FaCalendarAlt /> {t.due_date || "N/A"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(t);
                          }}
                        >
                          <FaExternalLinkAlt /> Open Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Task Modal */}
          {selectedTask && (
            <TaskModal
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onRefresh={fetchTasks}
              users={users}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskList;