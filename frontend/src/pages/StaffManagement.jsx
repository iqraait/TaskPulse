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
  FaCheckDouble,
  FaTasks,
  FaPlus,
  FaPlusCircle
} from "react-icons/fa";
import "./StaffManagement.css";

function StaffManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = user?.role || (user?.is_superuser ? 'superadmin' : 'staff');
  const userDept = user?.department || 'IT Department';

  // Form State for New User Creation
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState(role === 'superadmin' ? 'dept_admin' : 'staff');
  const [newDepartment, setNewDepartment] = useState(userDept);
  
  // Department Creation State
  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [creatingDept, setCreatingDept] = useState(false);

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

  const isSuperAdmin = role === 'superadmin';
  const canManageUsers = isSuperAdmin || role === 'dept_admin' || role === 'admin';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes] = await Promise.all([
        api.get("users/"),
        api.get("departments/").catch(() => ({ data: [] }))
      ]);
      setUsers(usersRes.data);

      if (deptsRes.data && deptsRes.data.length > 0) {
        setDepartments(deptsRes.data);
      } else {
        setDepartments([
          { id: 1, name: "IT Department" },
          { id: 2, name: "Sales" },
          { id: 3, name: "HR & Operations" },
          { id: 4, name: "Finance" },
          { id: 5, name: "Customer Support" },
          { id: 6, name: "Marketing & Design" },
        ]);
      }
    } catch (err) {
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = (selectedRole) => {
    setNewRole(selectedRole);
    if (selectedRole === 'dept_admin' || selectedRole === 'admin' || selectedRole === 'superadmin') {
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

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) return;

    try {
      setCreatingDept(true);
      const res = await api.post("departments/", {
        name: deptName.trim(),
        description: deptDesc.trim()
      });
      setDepartments(prev => [...prev, res.data]);
      setNewDepartment(res.data.name);
      setDeptName("");
      setDeptDesc("");
      setShowDeptModal(false);
      alert(`Department '${res.data.name}' created successfully!`);
    } catch (err) {
      console.error("Create department error:", err);
      alert("Failed to create department.");
    } finally {
      setCreatingDept(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      alert("Username and password are required.");
      return;
    }

    try {
      setCreating(true);
      const targetRole = isSuperAdmin ? newRole : 'staff';
      const targetDept = isSuperAdmin ? (newDepartment || 'IT Department') : userDept;

      const finalPrivileges = (targetRole === 'dept_admin' || targetRole === 'admin' || targetRole === 'superadmin') ? {
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

      alert(`User '${newUsername}' created successfully as ${targetRole.toUpperCase()} under '${targetDept}'!`);
      setShowModal(false);
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      fetchData();
    } catch (err) {
      console.error("Create user error:", err);
      alert(err.response?.data?.username ? err.response.data.username[0] : (err.response?.data?.error || "Failed to create user."));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.role === 'superadmin' || u.is_superuser) {
      alert("🔒 SUPER ADMIN PROTECTED:\n\nSuper Admin accounts are protected and cannot be deleted.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete staff member '${u.username}'?`)) {
      try {
        await api.delete(`users/${u.id}/`);
        fetchData();
      } catch (err) {
        console.error("Delete user error:", err);
        const errorMsg = err.response?.data?.error || "Failed to delete user.";
        alert(`❌ CANNOT DELETE STAFF:\n\n${errorMsg}`);
      }
    }
  };

  const getRoleBadge = (uRole, isSuper) => {
    if (uRole === 'superadmin' || isSuper) {
      return <span className="badge badge-superadmin"><FaCrown /> Super Admin</span>;
    } else if (uRole === 'dept_admin' || uRole === 'admin') {
      return <span className="badge badge-admin"><FaUserShield /> Department Head</span>;
    }
    return <span className="badge badge-staff"><FaUser /> Staff Member</span>;
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <div className="page-container">
          <div className="staff-header glass-card">
            <div className="header-info">
              <h2><FaUsers className="header-icon" /> Staff & Department Management</h2>
              <p>
                {isSuperAdmin
                  ? "Super Admin Hub — Create Departments, Department Heads & Staff across all departments"
                  : `Department Head Hub — Manage Staff members for (${userDept})`}
              </p>
            </div>

            <div className="header-action-btns">
              {isSuperAdmin && (
                <button className="btn btn-secondary" onClick={() => setShowDeptModal(true)}>
                  <FaBuilding /> Add Department
                </button>
              )}

              {canManageUsers && (
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                  <FaUserPlus /> {isSuperAdmin ? "Create User / Head" : "Add Staff Member"}
                </button>
              )}
            </div>
          </div>

          {/* User Cards Grid */}
          {loading ? (
            <div className="board-loading">Loading team members...</div>
          ) : (
            <div className="users-grid">
              {users.map((u) => {
                const uIsSuper = u.role === 'superadmin' || u.is_superuser;
                return (
                  <div key={u.id} className="user-card glass-card interactive">
                    <div className="card-top">
                      <div className={`user-avatar-large ${uIsSuper ? 'super-avatar' : ''}`}>
                        {u.username ? u.username.substring(0, 2).toUpperCase() : "U"}
                      </div>
                      <div className="user-card-title">
                        <h4>{u.username} {uIsSuper && <FaCrown className="crown-mini-icon" title="Super Admin" />}</h4>
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

                      <div className="user-meta-row">
                        <span className="meta-label">Active Workload:</span>
                        <span className={`badge ${u.pending_tasks_count > 3 ? 'badge-priority-high' : 'badge-priority-medium'}`}>
                          <FaTasks /> {u.pending_tasks_count || 0} Active Task(s)
                        </span>
                      </div>

                      {/* Display Staff Privileges */}
                      <div className="privileges-box-card">
                        <span className="privileges-title"><FaKey /> Granted Access:</span>
                        <div className="privilege-tags">
                          {uIsSuper ? (
                            <span className="priv-tag super-admin-tag">GLOBAL SYSTEM SUPER ADMIN</span>
                          ) : u.role === 'dept_admin' || u.role === 'admin' ? (
                            <span className="priv-tag full-admin-tag">DEPARTMENT HEAD ACCESS</span>
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
                          className={`btn btn-danger btn-sm ${uIsSuper ? 'btn-disabled-protected' : ''}`}
                          onClick={() => handleDeleteUser(u)}
                          disabled={uIsSuper && !isSuperAdmin}
                          title={uIsSuper ? "Super Admin accounts are protected" : "Remove User"}
                        >
                          <FaTrash /> {uIsSuper ? "Protected Admin" : "Remove User"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Department Modal */}
          {showDeptModal && (
            <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
              <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3><FaBuilding /> Add New Department</h3>
                  <button className="icon-btn" onClick={() => setShowDeptModal(false)}>
                    <FaTimes />
                  </button>
                </div>
                <form onSubmit={handleCreateDepartment}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label className="form-label">Department Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g., Logistics, Operations, Design"
                        value={deptName}
                        onChange={(e) => setDeptName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description (Optional)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Brief overview of department scope"
                        value={deptDesc}
                        onChange={(e) => setDeptDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowDeptModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={creatingDept}>
                      {creatingDept ? "Saving..." : "Create Department"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Create User Modal */}
          {showModal && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content modal-large-privileges" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3><FaUserPlus /> {isSuperAdmin ? "Create User / Department Head" : `Add Staff Member (${userDept})`}</h3>
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

                      {/* Select Account Role */}
                      <div className="form-group">
                        <label className="form-label"><FaShieldAlt /> Account Role Type *</label>
                        {isSuperAdmin ? (
                          <select
                            className="form-select role-select-highlight"
                            value={newRole}
                            onChange={(e) => handleRoleChange(e.target.value)}
                          >
                            <option value="dept_admin">Department Head / Manager</option>
                            <option value="staff">Staff Member</option>
                            <option value="superadmin">Super Admin (Global System Access)</option>
                          </select>
                        ) : (
                          <input className="form-input" value="Staff Member (Locked to Department)" disabled />
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Department *</label>
                        {isSuperAdmin ? (
                          <select
                            className="form-select"
                            value={newDepartment}
                            onChange={(e) => setNewDepartment(e.target.value)}
                          >
                            {departments.map((d) => (
                              <option key={d.id} value={d.name}>{d.name}</option>
                            ))}
                          </select>
                        ) : (
                          <input className="form-input" value={userDept} disabled />
                        )}
                      </div>
                    </div>

                    {/* Privileges Panel */}
                    <div className="modal-right-privileges">
                      <div className="privileges-header-row">
                        <div>
                          <h4 className="privileges-checklist-title"><FaKey /> Granted Features & Access</h4>
                          <p className="privileges-desc">
                            {newRole === 'dept_admin' || newRole === 'superadmin'
                              ? "⚡ HEAD / SUPER ADMIN ROLE: Gets FULL department & task management features automatically!"
                              : "⚙️ STAFF ROLE: Configure specific access permissions for this staff member:"}
                          </p>
                        </div>
                      </div>

                      {newRole === 'dept_admin' || newRole === 'superadmin' ? (
                        <div className="admin-full-access-box">
                          <FaCrown className="admin-crown-icon" />
                          <div>
                            <strong>Full Department Management Unlocked</strong>
                            <p>Department Heads can create staff under their department, assign tasks, view department analytics, and manage team communication.</p>
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
                      {creating ? "Creating Account..." : `Create Account`}
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