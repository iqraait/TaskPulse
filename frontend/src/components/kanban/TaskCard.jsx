import { Draggable } from "@hello-pangea/dnd";
import { FaClock, FaComment, FaUserCircle, FaUsers, FaExclamationCircle, FaTag, FaBug, FaWrench, FaStar, FaExchangeAlt } from "react-icons/fa";
import "./Kanban.css";

function TaskCard({ task, index, onSelectTask }) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <span className="badge badge-priority-high">High Priority</span>;
      case "medium":
        return <span className="badge badge-priority-medium">Medium</span>;
      default:
        return <span className="badge badge-priority-low">Low Priority</span>;
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case "bug":
        return <span className="badge badge-bug"><FaBug /> Bug</span>;
      case "feature":
        return <span className="badge badge-feature"><FaStar /> Feature</span>;
      case "maintenance":
        return <span className="badge badge-maint"><FaWrench /> Maint</span>;
      default:
        return <span className="badge badge-task-type"><FaTag /> Task</span>;
    }
  };

  const formatAssigneeDisplay = () => {
    const primary = task.assigned_to_username;
    const secondary = task.assigned_to_secondary_username;

    if (primary && secondary && primary !== "Unassigned") {
      return `${primary} & ${secondary}`;
    } else if (primary && primary !== "Unassigned") {
      return primary;
    } else if (secondary) {
      return secondary;
    }
    return "Unassigned";
  };

  return (
    <Draggable draggableId={String(task.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`task-card glass-card interactive card-status-${task.status} ${
            task.is_reassigned ? "card-reassigned-highlight" : ""
          } ${snapshot.isDragging ? "dragging" : ""}`}
          onClick={() => onSelectTask && onSelectTask(task)}
        >
          {/* Top Bar: Ticket Code, Reassigned Badge & Category */}
          <div className="task-card-topbar">
            <div className="topbar-left-badges">
              <span className="ticket-code-tag">{task.ticket_code || `#TK-${task.id}`}</span>
              {task.is_reassigned && (
                <span className="badge badge-reassigned-purple"><FaExchangeAlt /> Reassigned</span>
              )}
            </div>
            {getCategoryBadge(task.category)}
          </div>

          {/* Title & Description */}
          <h4 className="task-card-title">{task.title}</h4>
          {task.description && (
            <p className="task-card-desc">
              {task.description.length > 85
                ? `${task.description.substring(0, 85)}...`
                : task.description}
            </p>
          )}

          {/* Tags: Department & Priority */}
          <div className="task-card-mid">
            <span className="task-dept-tag">{task.department}</span>
            {getPriorityBadge(task.priority)}
          </div>

          {/* Footer: Assignees & Meta */}
          <div className="task-card-footer">
            <div className={`task-assignee ${task.is_reassigned ? 'assignee-reassigned-purple' : ''}`}>
              {task.assigned_to_secondary_username ? <FaUsers className="assignee-icon" /> : <FaUserCircle className="assignee-icon" />}
              <span>{formatAssigneeDisplay()}</span>
            </div>

            <div className="task-meta">
              {task.due_date && (
                <span className={`meta-item ${isOverdue ? "overdue" : ""}`}>
                  {isOverdue ? <FaExclamationCircle /> : <FaClock />}
                  {task.due_date}
                </span>
              )}

              {task.comments && task.comments.length > 0 && (
                <span className="meta-item comment-count-tag">
                  <FaComment /> {task.comments.length}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default TaskCard;