import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { FaPlusCircle, FaArrowLeft, FaCheck, FaPaperclip, FaFileAlt, FaImage, FaTrashAlt, FaUsers } from "react-icons/fa";
import "./CreateTask.css";

function CreateTask() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("IT Department");
  const [priority, setPriority] = useState("medium");
  const [assignedTo, setAssignedTo] = useState("");
  const [assignedToSecondary, setAssignedToSecondary] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("users/");
        setUsers(res.data);
      } catch (err) {
        console.error("Fetch users error:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachmentFile(file);
      if (file.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(file));
      } else {
        setFilePreview(null);
      }
    }
  };

  const removeFile = () => {
    setAttachmentFile(null);
    setFilePreview(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a task title.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("department", department);
      formData.append("priority", priority);
      formData.append("status", "pending");
      if (assignedTo) formData.append("assigned_to", parseInt(assignedTo));
      if (assignedToSecondary) formData.append("assigned_to_secondary", parseInt(assignedToSecondary));
      if (dueDate) formData.append("due_date", dueDate);
      if (attachmentFile) formData.append("attachment", attachmentFile);

      await api.post("tasks/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccessMsg("Task created successfully with dual staff assignment!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      console.error("Create task error:", err);
      alert("Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="page-container">
          <div className="create-task-wrapper glass-card">
            {/* Header */}
            <div className="create-header">
              <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
                <FaArrowLeft /> Back
              </button>
              <h2><FaPlusCircle className="header-icon" /> Create New Ticket / Task</h2>
            </div>

            {successMsg && (
              <div className="success-banner">
                <FaCheck /> {successMsg}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreate} className="create-task-form">
              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Update Server Security Certificates"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  placeholder="Provide detailed context, error logs, or acceptance criteria..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* File / Image Attachment Section */}
              <div className="form-group">
                <label className="form-label"><FaPaperclip /> Attach Files or Images</label>
                
                <div className="file-upload-dropzone">
                  <input
                    type="file"
                    id="task-file-input"
                    className="file-input-hidden"
                    onChange={handleFileChange}
                  />
                  
                  {!attachmentFile ? (
                    <label htmlFor="task-file-input" className="dropzone-label">
                      <FaPaperclip className="dropzone-icon" />
                      <div>
                        <strong>Click to select a file or image</strong>
                        <span>Supports PNG, JPG, PDF, DOCX, ZIP, log files, etc.</span>
                      </div>
                    </label>
                  ) : (
                    <div className="file-attached-preview-box">
                      {filePreview ? (
                        <div className="image-preview-wrap">
                          <img src={filePreview} alt="Upload preview" className="uploaded-img-preview" />
                          <div className="file-info-text">
                            <span className="file-name"><FaImage /> {attachmentFile.name}</span>
                            <span className="file-size">({(attachmentFile.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        </div>
                      ) : (
                        <div className="doc-preview-wrap">
                          <FaFileAlt className="doc-icon" />
                          <div className="file-info-text">
                            <span className="file-name">{attachmentFile.name}</span>
                            <span className="file-size">({(attachmentFile.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        </div>
                      )}

                      <button type="button" className="btn-remove-file" onClick={removeFile} title="Remove file">
                        <FaTrashAlt /> Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Department</label>
                <select
                  className="form-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="IT Department">IT Department</option>
                  <option value="Executive Management">Executive Management</option>
                  <option value="HR & Operations">HR & Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing & Design">Marketing & Design</option>
                </select>
              </div>

              {/* Multi-Staff Assignment Section (Primary + Secondary) */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label"><FaUsers /> Primary Assignee</label>
                  <select
                    className="form-select"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        👤 {u.username} ({u.role || "staff"}) — {u.department || "General"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label"><FaUsers /> Secondary Assignee (Optional)</label>
                  <select
                    className="form-select"
                    value={assignedToSecondary}
                    onChange={(e) => setAssignedToSecondary(e.target.value)}
                  >
                    <option value="">None (Single Assignee)</option>
                    {users.filter(u => u.id.toString() !== assignedTo).map((u) => (
                      <option key={u.id} value={u.id}>
                        👥 {u.username} ({u.role || "staff"}) — {u.department || "General"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <div className="priority-picker">
                    <button
                      type="button"
                      className={`priority-btn low ${priority === "low" ? "active" : ""}`}
                      onClick={() => setPriority("low")}
                    >
                      Low Priority
                    </button>
                    <button
                      type="button"
                      className={`priority-btn medium ${priority === "medium" ? "active" : ""}`}
                      onClick={() => setPriority("medium")}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      className={`priority-btn high ${priority === "high" ? "active" : ""}`}
                      onClick={() => setPriority("high")}
                    >
                      High Priority
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Due Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Creating Ticket..." : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateTask;