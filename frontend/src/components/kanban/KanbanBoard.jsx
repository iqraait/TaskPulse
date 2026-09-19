import { useEffect, useState, useCallback } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import KanbanColumn from "./KanbanColumn";
import TaskModal from "./TaskModal";
import { FaFilter, FaRedo, FaUserCheck } from "react-icons/fa";
import "./Kanban.css";

function KanbanBoard({ searchQuery = "" }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("tasks/");
      setTasks(res.data);
    } catch (err) {
      console.error("Fetch tasks error:", err);
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

  const updateTaskStatus = async (id, status) => {
    setTasks((prev) =>
      prev.map((t) => (String(t.id) === String(id) ? { ...t, status } : t))
    );

    try {
      await api.patch(`tasks/${id}/`, { status });
    } catch (err) {
      console.error("Update task status error:", err);
      fetchTasks();
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    const oldStatus = result.source.droppableId;

    if (newStatus !== oldStatus) {
      updateTaskStatus(taskId, newStatus);
    }
  };

  const departments = Array.from(
    new Set(tasks.map((t) => t.department).filter(Boolean))
  );

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.ticket_code && t.ticket_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.department && t.department.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority =
      priorityFilter === "all" || t.priority === priorityFilter;

    const matchesDepartment =
      departmentFilter === "all" || t.department === departmentFilter;

    const matchesCategory =
      categoryFilter === "all" || t.category === categoryFilter;

    const matchesMyTasks =
      !onlyMyTasks ||
      (user && (t.assigned_to === user.id || t.created_by === user.id));

    return (
      matchesSearch &&
      matchesPriority &&
      matchesDepartment &&
      matchesCategory &&
      matchesMyTasks
    );
  });

  const pendingTasks = filteredTasks.filter((t) => t.status === "pending");
  const progressTasks = filteredTasks.filter((t) => t.status === "progress");
  const doneTasks = filteredTasks.filter((t) => t.status === "done");

  return (
    <div className="kanban-wrapper">
      {/* Strict Single Horizontal Row Filter Toolbar */}
      <div className="kanban-toolbar">
        <div className="filter-row-container">
          <span className="filter-title"><FaFilter /> Filter Tickets:</span>

          <button
            type="button"
            className={`btn btn-sm my-tasks-btn ${onlyMyTasks ? "active" : ""}`}
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
          >
            <FaUserCheck /> My Tasks
          </button>
          
          <select
            className="form-select filter-select-inline"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <select
            className="form-select filter-select-inline"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="task">Task 📝</option>
            <option value="bug">Bug / Issue 🐛</option>
            <option value="feature">Feature ✨</option>
            <option value="maintenance">Maintenance 🛠️</option>
          </select>

          {departments.length > 0 && (
            <select
              className="form-select filter-select-inline"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          )}

          <button className="btn btn-secondary btn-sm refresh-inline-btn" onClick={fetchTasks} title="Refresh board">
            <FaRedo /> Refresh
          </button>
        </div>
      </div>

      {/* Drag & Drop Board */}
      {loading ? (
        <div className="board-loading">Loading ticket board...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board-grid">
            <KanbanColumn
              title="Pending"
              tasks={pendingTasks}
              status="pending"
              onSelectTask={setSelectedTask}
            />
            <KanbanColumn
              title="In Progress"
              tasks={progressTasks}
              status="progress"
              onSelectTask={setSelectedTask}
            />
            <KanbanColumn
              title="Completed"
              tasks={doneTasks}
              status="done"
              onSelectTask={setSelectedTask}
            />
          </div>
        </DragDropContext>
      )}

      {/* Task Detail & Chat Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onRefresh={fetchTasks}
          users={users}
        />
      )}
    </div>
  );
}

export default KanbanBoard;