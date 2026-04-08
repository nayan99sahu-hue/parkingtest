import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const defaultForm = { name: "", email: "", password: "", role: "OPERATOR" };

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return toast.error("All fields required");
    setSaving(true);
    try {
      await api.post("/users", form);
      toast.success("User created!");
      setShowModal(false);
      setForm(defaultForm);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (u) => {
    if (u.id === me.id) return toast.error("Cannot delete yourself");
    if (!confirm(`Delete user "${u.name}"?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast.success("User deleted");
      fetch();
    } catch { toast.error("Delete failed"); }
  };

  const roleBadge = (role) => role === "SUPER_ADMIN"
    ? <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Super Admin</span>
    : <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">Operator</span>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Users</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage admins and operators</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 active:scale-95 transition-all shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">User</th>
                <th className="px-6 py-3 text-left font-semibold">Email</th>
                <th className="px-6 py-3 text-left font-semibold">Role</th>
                <th className="px-6 py-3 text-left font-semibold">Joined</th>
                <th className="px-6 py-3 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800">{u.name}</span>
                      {u.id === me.id && <span className="text-xs text-slate-400">(you)</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{u.email}</td>
                  <td className="px-6 py-4">{roleBadge(u.role)}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                    {new Date(u.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.id !== me.id && (
                      <button onClick={() => handleDelete(u)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 active:scale-95 transition-all">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in">
            <h3 className="text-lg font-extrabold text-slate-800 mb-5">Create User</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1.5">Full Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="John Doe" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="john@example.com" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1.5">Password</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="••••••••" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1.5">Role</label>
                <div className="flex gap-3">
                  {["OPERATOR", "SUPER_ADMIN"].map((r) => (
                    <button key={r} onClick={() => setForm({ ...form, role: r })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${form.role === r ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {r === "OPERATOR" ? "Operator" : "Super Admin"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setForm(defaultForm); }}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 active:scale-95 transition-transform">Cancel</button>
              <button onClick={handleCreate} disabled={saving}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-60">
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
