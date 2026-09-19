import { useState, useEffect, useCallback } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { 
  FaUsers, 
  FaUserPlus, 
  FaCrown, 
  FaUserShield, 
  FaUser, 
  FaTrash, 
  FaTimes, 
  FaBuilding, 
  FaEnvelope, 
  FaLock,
  FaShieldAlt,
  FaKey,
  FaCheckSquare,
  FaSquare,
  FaCheckDouble
} from "react-icons/fa";
import "./StaffManagement.css";

function StaffManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = user?.role || (user?.is_superuser ? 'superadmin' : 'staff');
  const userDept = user?.department || 'IT Department';

  // Form State for New User Creation
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("staff");
  const [newDepartment, setNewDepartment] = useState(userDept);
  
  // Staff Privileges Checklist State
  const [privileges, setPrivileges] = useState({
    can_create_tasks: true,
    can_edit_status: true,
    can_assign_tasks: false,
    can_delete_tasks: false,
    can_view_reports: false,
    can_chat: true,
  });

  const [creating, setCreating] = useState(false);

  const canManageUsers = role === 'superadmin' || role === 'admin';

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("users/");
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Auto grant ALL privileges if Role is set to Admin / Superadmin
  const handleRoleChange = (selectedRole) => {
    setNewRole(selectedRole);
    if (selectedRole === 'admin' || selectedRole === 'superadmin') {
      setPrivileges({
        can_create_tasks: true,
        can_edit_status: true,
        can_assign_tasks: true,
        can_delete_tasks: true,
        can_view_reports: true,
        can_chat: true,
      });
    } else {
      setPrivileges({
        can_create_tasks: true,
        can_edit_status: true,
        can_assign_tasks: false,
        can_delete_tasks: false,
        can_view_reports: false,
        can_chat: true,
      });
    }
  };

  const togglePrivilege = (key) => {
    setPrivileges((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllPrivileges = () => {
    setPrivileges({
      can_create_tasks: true,
      can_edit_status: true,
      can_assign_tasks: true,
      can_delete_tasks: true,
      can_view_reports: true,
      can_chat: true,
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      alert("Username and password are required.");
      return;
    }

    try {
      setCreating(true);
      const targetRole = newRole;
      const targetDept = role === 'admin' ? userDept : newDepartment;

      // If Admin role selected, ensure ALL privileges are granted automatically
      const finalPrivileges = (targetRole === 'admin' || targetRole === 'superadmin') ? {
        can_create_tasks: true,
        can_edit_status: true,
        can_assign_tasks: true,
        can_delete_tasks: true,
        can_view_reports: true,
        can_chat: true,
      } : privileges;

      await api.post("users/", {
        username: newUsername,
        email: newEmail,
        password: newPassword,
        role: targetRole,
        department: targetDept,
        privileges: finalPrivileges,
        is_superuser: targetRole === "superadmin"
      });

      alert(`User '${newUsername}' created successfully as ${targetRole.toUpperCase()} with ${targetRole === 'admin' ? 'Full Admin Access' : 'Custom Privileges'}!`);
      setShowModal(false);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      fetchUsers();
    } catch (err) {
      console.error("Create user error:", err);
      alert(err.response?.data?.username ? err.response.data.username[0] : "Failed to create user.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user '${username}'?`)) {
      try {
        await api.delete(`users/${userId}/`);
        fetchUsers();
      } catch (err) {
        console.error("Delete user error:", err);
        alert("Failed to delete user.");
      }
    }
  };

  const getRoleBadge = (uRole, isSuper) => {
    if (uRole === 'superadmin' || isSuper) {
      return <span className="badge badge-superadmin"><FaCrown /> Super Admin</span>;
    } else if (uRole === 'admin') {
      return <span className="badge badge-admin"><FaUserShield /> Department Admin</span>;
    }
    return <span className="badge badge-staff"><FaUser /> Staff</span>;
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="page-container">
          <div className="staff-header glass-card">
            <div className="header-info">
              <h2><FaUsers className="header-icon" /> Staff & Role Privilege Management</h2>
              <p>
                {role === 'superadmin'
                  ? "Super Admin Hub — Create Department Admins (Full Features) & Staff (Custom Privileges)"
                  : `Department Admin Hub — Manage Staff & Admins for (${userDept})`}
              </p>
            </div>

            {canManageUsers && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <FaUserPlus /> Create Admin or Staff Member
              </button>
            )}
          </div>

          {/* User Cards Grid */}
          {loading ? (
            <div className="board-loading">Loading team members...</div>
          ) : (
            <div className="users-grid">
              {users.map((u) => (
                <div key={u.id} className="user-card glass-card interactive">
                  <div className="card-top">
                    <div className="user-avatar-large">
                      {u.username ? u.username.substring(0, 2).toUpperCase() : "U"}
                    </div>
                    <div className="user-card-title">
                      <h4>{u.username}</h4>
                      <p><FaEnvelope /> {u.email || "No email set"}</p>
                    </div>
                  </div>

                  <div className="card-mid">
                    <div className="user-meta-row">
                      <span className="meta-label">Role:</span>
                      {getRoleBadge(u.role, u.is_superuser)}
                    </div>
                    <div className="user-meta-row">
                      <span className="meta-label">Department:</span>
                      <span className="dept-pill"><FaBuilding /> {u.department || "General"}</span>
                    </div>

                    {/* Display Staff Privileges */}
                    <div className="privileges-box-card">
                      <span className="privileges-title"><FaKey /> Granted Features & Access:</span>
                      <div className="privilege-tags">
                        {u.role === 'admin' || u.role === 'superadmin' ? (
                          <span className="priv-tag full-admin-tag">FULL ADMIN FEATURES & PERMISSIONS</span>
                        ) : (
                          <>
                            {u.privileges?.can_create_tasks && <span className="priv-tag">Create Tasks</span>}
                            {u.privileges?.can_edit_status && <span className="priv-tag">Edit Status</span>}
                            {u.privileges?.can_assign_tasks && <span className="priv-tag">Reassign Tasks</span>}
                            {u.privileges?.can_delete_tasks && <span className="priv-tag">Delete Tasks</span>}
                            {u.privileges?.can_view_reports && <span className="priv-tag">Reports</span>}
                            {u.privileges?.can_chat && <span className="priv-tag">Team Chat</span>}
                            {(!u.privileges || Object.keys(u.privileges).length === 0) && (
                              <span className="priv-tag standard">Standard Staff Access</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {canManageUsers && user?.id !== u.id && (
                    <div className="card-actions">
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteUser(u.id, u.username)}
                      >
                        <FaTrash /> Remove User
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Create User Modal with Role Selection (Admin vs Staff) */}
          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content modal-large-privileges" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3><FaUserPlus /> Create Admin or Staff Account</h3>
                  <button className="icon-btn" onClick={() => setShowModal(false)}>
                    <FaTimes />
                  </button>
                </div>

                <form onSubmit={handleCreateUser}>
                  <div className="modal-body modal-grid-privileges">
                    <div className="modal-left-inputs">
                      <div className="form-group">
                        <label className="form-label">Username *</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g., johndoe"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="john@company.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label"><FaLock /> Password *</label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="Set account password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>

                      {/* Select Account Role: Admin vs Staff */}
                      <div className="form-group">
                        <label className="form-label"><FaShieldAlt /> Account Role Type *</label>
                        <select
                          className="form-select role-select-highlight"
                          value={newRole}
                          onChange={(e) => handleRoleChange(e.target.value)}
                        >
                          <option value="staff">Staff Member (Custom Privileges Access)</option>
                          <option value="admin">Department Admin / Manager (Full Features Access)</option>
                          {role === 'superadmin' && <option value="superadmin">Super Admin (Global System Access)</option>}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Department</label>
                        {role === 'superadmin' ? (
                          <select
                            className="form-select"
                            value={newDepartment}
                            onChange={(e) => setNewDepartment(e.target.value)}
                          >
                            <option value="IT Department">IT Department</option>
                            <option value="HR & Operations">HR & Operations</option>
                            <option value="Finance">Finance</option>
                            <option value="Marketing & Design">Marketing & Design</option>
                            <option value="Executive Management">Executive Management</option>
                          </select>
                        ) : (
                          <input className="form-input" value={userDept} disabled />
                        )}
                      </div>
                    </div>

                    {/* Privileges Configuration Panel */}
                    <div className="modal-right-privileges">
                      <div className="privileges-header-row">
                        <div>
                          <h4 className="privileges-checklist-title"><FaKey /> Granted Features & Access</h4>
                          <p className="privileges-desc">
                            {newRole === 'admin' || newRole === 'superadmin'
                              ? "⚡ ADMIN ROLE: Gets ALL system features and management permissions automatically!"
                              : "⚙️ STAFF ROLE: Configure specific access permissions for this staff member:"}
                          </p>
                        </div>
                      </div>

                      {newRole === 'admin' || newRole === 'superadmin' ? (
                        <div className="admin-full-access-box">
                          <FaCrown className="admin-crown-icon" />
                          <div>
                            <strong>Full Admin Privileges Unlocked</strong>
                            <p>Department Admins get full management access to create tasks, reassign staff, view reports, delete tickets, and manage team chat.</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="select-all-bar">
                            <button type="button" className="btn-select-all" onClick={selectAllPrivileges}>
                              <FaCheckDouble /> Grant All Staff Access
                            </button>
                          </div>

                          <div className="privilege-checklist">
                            <div className="priv-check-item" onClick={() => togglePrivilege("can_create_tasks")}>
                              {privileges.can_create_tasks ? <FaCheckSquare className="check-icon active" /> : <FaSquare className="check-icon" />}
                              <div>
                                <strong>Create Tasks & Tickets</strong>
                                <span>Allow user to create new tasks for department</span>
                              </div>
                            </div>

                            <div className="priv-check-item" onClick={() => togglePrivilege("can_edit_status")}>
                              {privileges.can_edit_status ? <FaCheckSquare className="check-icon active" /> : <FaSquare className="check-icon" />}
                              <div>
                                <strong>Update Task Status</strong>
                                <span>Allow user to drag & update task workflow status</span>
                              </div>
                            </div>

                            <div className="priv-check-item" onClick={() => togglePrivilege("can_assign_tasks")}>
                              {privileges.can_assign_tasks ? <FaCheckSquare className="check-icon active" /> : <FaSquare className="check-icon" />}
                              <div>
                                <strong>Reassign Tasks</strong>
                                <span>Allow user to reassign tasks to team members</span>
                              </div>
                            </div>

                            <div className="priv-check-item" onClick={() => togglePrivilege("can_delete_tasks")}>
                              {privileges.can_delete_tasks ? <FaCheckSquare className="check-icon active" /> : <FaSquare className="check-icon" />}
                              <div>
                                <strong>Delete Tasks</strong>
                                <span>Grant permission to delete department tasks</span>
                              </div>
                            </div>

                            <div className="priv-check-item" onClick={() => togglePrivilege("can_view_reports")}>
                              {privileges.can_view_reports ? <FaCheckSquare className="check-icon active" /> : <FaSquare className="check-icon" />}
                              <div>
                                <strong>View Analytics Reports</strong>
                                <span>Access ticket trends & department metrics</span>
                              </div>
                            </div>

                            <div className="priv-check-item" onClick={() => togglePrivilege("can_chat")}>
                              {privileges.can_chat ? <FaCheckSquare className="check-icon active" /> : <FaSquare className="check-icon" />}
                              <div>
                                <strong>Department Team Chat</strong>
                                <span>Allow user to participate in real-time team chat</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={creating}>
                      {creating ? "Creating Account..." : `Create ${newRole.toUpperCase()} Account`}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StaffManagement;