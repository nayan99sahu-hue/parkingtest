import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const COLORS = ["#3B82F6","#10B981","#8B5CF6","#F59E0B","#EF4444","#EC4899","#14B8A6","#F97316","#6366F1","#84CC16"];

const defaultForm = { name: "", value: "", color: "#3B82F6", serialStart: "0" };

export default function TicketTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = create
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    try {
      const res = await api.get("/ticket-types");
      setTypes(res.data);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setEditing(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, value: String(t.value), color: t.color, serialStart: String(t.serialCounter?.currentSerial || 0) });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.value) return toast.error("Name and value required");
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/ticket-types/${editing.id}`, { name: form.name, value: form.value, color: form.color });
        toast.success("Updated!");
      } else {
        await api.post("/ticket-types", { ...form });
        toast.success("Created!");
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.error || "Save failed");
    } finally { setSaving(false); }
  };

  const toggleActive = async (t) => {
    try {
      await api.put(`/ticket-types/${t.id}`, { isActive: !t.isActive });
      toast.success(t.isActive ? "Deactivated" : "Activated");
      fetch();
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete "${t.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/ticket-types/${t.id}`);
      toast.success("Deleted");
      fetch();
    } catch { toast.error("Cannot delete — entries exist"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Ticket Types</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage ticket categories and pricing</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white font-semibold text-sm hover:bg-blue-600 active:scale-95 transition-all shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Add Type
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((t) => (
            <div key={t.id} className={`bg-white rounded-2xl p-5 border-2 shadow-sm transition-all ${t.isActive ? "border-slate-100" : "border-slate-100 opacity-60"}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: t.color + "20" }}>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{t.name}</p>
                    <p className="text-sm font-semibold" style={{ color: t.color }}>₹{t.value}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleActive(t)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${t.isActive ? "bg-green-500" : "bg-slate-300"}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${t.isActive ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl px-4 py-2.5 mb-4">
                <p className="text-xs text-slate-400 font-medium">Current Serial</p>
                <p className="text-lg font-extrabold text-slate-800 font-mono">{t.serialCounter?.currentSerial ?? "—"}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => openEdit(t)} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all">Edit</button>
                <button onClick={() => handleDelete(t)} className="flex-1 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-500 hover:bg-red-100 active:scale-95 transition-all">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in">
            <h3 className="text-lg font-extrabold text-slate-800 mb-5">{editing ? "Edit Ticket Type" : "New Ticket Type"}</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1.5">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g. ₹5 Ticket" />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-1.5">Value (₹)</label>
                <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="5" min="1" />
              </div>
              {!editing && (
                <div>
                  <label className="text-sm font-semibold text-slate-600 block mb-1.5">Starting Serial</label>
                  <input type="number" value={form.serialStart} onChange={(e) => setForm({ ...form, serialStart: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300"
                    placeholder="0" min="0" />
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-slate-600 block mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setForm({ ...form, color: c })}
                      className="w-8 h-8 rounded-full transition-transform active:scale-90"
                      style={{ backgroundColor: c, outline: form.color === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 active:scale-95 transition-transform">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-60">
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
