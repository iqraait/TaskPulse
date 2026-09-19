import { Droppable } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import { FaHourglassHalf, FaSpinner, FaCheckCircle, FaPlus } from "react-icons/fa";
import "./Kanban.css";

function KanbanColumn({ title, tasks, status, onSelectTask, onQuickCreate }) {
  const getHeaderIcon = () => {
    switch (status) {
      case "pending":
        return <FaHourglassHalf className="col-icon pending-icon" />;
      case "progress":
        return <FaSpinner className="col-icon progress-icon spin-icon" />;
      case "done":
        return <FaCheckCircle className="col-icon done-icon" />;
      default:
        return null;
    }
  };

  return (
    <div className={`kanban-column col-${status}`}>
      {/* Column Header */}
      <div className={`kanban-column-header header-${status}`}>
        <div className="col-title-wrap">
          {getHeaderIcon()}
          <h3>{title}</h3>
          <span className={`col-count-badge count-${status}`}>{tasks.length}</span>
        </div>

        {onQuickCreate && (
          <button
            className="quick-add-btn"
            onClick={() => onQuickCreate(status)}
            title={`Add task to ${title}`}
          >
            <FaPlus />
          </button>
        )}
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`droppable-area area-${status} ${
              snapshot.isDraggingOver ? "dragging-over" : ""
            }`}
          >
            {tasks.length === 0 ? (
              <div className="empty-column-placeholder">
                <p>No tasks in {title.toLowerCase()}</p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  onSelectTask={onSelectTask}
                />
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default KanbanColumn;