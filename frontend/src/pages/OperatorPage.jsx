import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

// Ripple effect hook
function useRipple() {
  const [ripples, setRipples] = useState([]);
  const addRipple = useCallback((e, id) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const key = Date.now();
    setRipples((prev) => [...prev, { key, x, y, id }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.key !== key)), 600);
  }, []);
  return [ripples, addRipple];
}

export default function OperatorPage() {
  const { user, logout } = useAuth();
  const [ticketTypes, setTicketTypes] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [ripples, addRipple] = useRipple();
  const historyRef = useRef([]); // For undo

  useEffect(() => {
    fetchTicketTypes();
  }, []);

  const fetchTicketTypes = async () => {
    try {
      const res = await api.get("/ticket-types");
      setTicketTypes(res.data);
      const initial = {};
      res.data.forEach((t) => (initial[t.id] = 0));
      setCounts(initial);
    } catch {
      toast.error("Failed to load ticket types");
    } finally {
      setLoading(false);
    }
  };

  // Tap = increment by 1
  const handleTap = useCallback((e, id) => {
    addRipple(e, id);
    historyRef.current.push(id); // track for undo
    setCounts((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }, [addRipple]);

  // Reset single card
  const resetCard = (e, id) => {
    e.stopPropagation();
    historyRef.current = historyRef.current.filter((h) => h !== id);
    setCounts((prev) => ({ ...prev, [id]: 0 }));
  };

  // Undo last tap
  const handleUndo = () => {
    if (historyRef.current.length === 0) return;
    const last = historyRef.current.pop();
    setCounts((prev) => ({ ...prev, [last]: Math.max(0, (prev[last] || 0) - 1) }));
    toast("↩ Undone", { icon: "↩", duration: 1500 });
  };

  const totalTickets = Object.values(counts).reduce((s, v) => s + v, 0);
  const totalAmount = ticketTypes.reduce((s, t) => s + (counts[t.id] || 0) * t.value, 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const entries = ticketTypes
        .filter((t) => counts[t.id] > 0)
        .map((t) => ({ ticketTypeId: t.id, quantity: counts[t.id] }));

      await api.post("/entries", { entries });
      toast.success(`✅ Entry saved! ${totalTickets} tickets, ₹${totalAmount}`);

      // Reset
      const reset = {};
      ticketTypes.forEach((t) => (reset[t.id] = 0));
      setCounts(reset);
      historyRef.current = [];
      setShowConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 mt-3 font-medium">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm leading-none">ParkingPOS</h1>
            <p className="text-slate-400 text-xs mt-0.5">{user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {historyRef.current.length > 0 && (
            <button onClick={handleUndo} className="px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-600 rounded-lg border border-amber-200 active:scale-95 transition-transform">
              ↩ Undo
            </button>
          )}
          <button onClick={logout} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg active:scale-95 transition-transform">
            Logout
          </button>
        </div>
      </header>

      {/* Ticket grid */}
      <main className="flex-1 p-4 pb-32">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-1">Tap to add tickets</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {ticketTypes.map((type) => {
            const count = counts[type.id] || 0;
            const typeRipples = ripples.filter((r) => r.id === type.id);

            return (
              <div
                key={type.id}
                className="relative overflow-hidden rounded-2xl shadow-sm border-2 transition-all duration-150 active:scale-95 cursor-pointer select-none"
                style={{ borderColor: count > 0 ? type.color : "#e2e8f0", backgroundColor: count > 0 ? type.color + "15" : "white" }}
                onClick={(e) => handleTap(e, type.id)}
              >
                {/* Ripple effects */}
                {typeRipples.map((r) => (
                  <span
                    key={r.key}
                    className="absolute pointer-events-none rounded-full animate-tap-ripple"
                    style={{
                      left: r.x - 20, top: r.y - 20,
                      width: 40, height: 40,
                      background: type.color + "60",
                    }}
                  />
                ))}

                {/* Reset icon */}
                {count > 0 && (
                  <button
                    onClick={(e) => resetCard(e, type.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-slate-400 hover:text-red-500 active:scale-90 transition-all z-10"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                <div className="p-4 pt-5">
                  {/* Color dot */}
                  <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: type.color }} />

                  {/* Count — BIG number */}
                  <div
                    className="font-extrabold leading-none mb-2 transition-all duration-200"
                    style={{ fontSize: count > 99 ? "2.5rem" : "3.5rem", color: count > 0 ? type.color : "#cbd5e1" }}
                  >
                    {count}
                  </div>

                  {/* Ticket name */}
                  <p className="font-bold text-slate-700 text-sm">{type.name}</p>
                  {count > 0 && (
                    <p className="text-xs font-semibold mt-1" style={{ color: type.color }}>
                      ₹{count * type.value}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-xl z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tickets</p>
              <p className="text-xl font-extrabold text-slate-800">{totalTickets}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Amount</p>
              <p className="text-xl font-extrabold text-green-600">₹{totalAmount}</p>
            </div>
          </div>
          <button
            onClick={() => totalTickets > 0 && setShowConfirm(true)}
            disabled={totalTickets === 0}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
            style={{ background: totalTickets > 0 ? "linear-gradient(135deg,#3B82F6,#1D4ED8)" : undefined, boxShadow: totalTickets > 0 ? "0 4px 15px rgba(59,130,246,0.4)" : undefined }}
          >
            Submit Entry →
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-bounce-in">
            <h3 className="text-lg font-extrabold text-slate-800 mb-1">Confirm Entry</h3>
            <p className="text-slate-500 text-sm mb-4">Review before submitting</p>

            <div className="space-y-2 mb-5 max-h-48 overflow-y-auto">
              {ticketTypes.filter((t) => counts[t.id] > 0).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 px-3 rounded-xl" style={{ backgroundColor: t.color + "15" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="font-semibold text-slate-700 text-sm">{t.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-800">{counts[t.id]}×</span>
                    <span className="text-xs text-slate-500 ml-1">= ₹{counts[t.id] * t.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 pt-3 mb-5 flex justify-between">
              <span className="font-bold text-slate-700">Total</span>
              <div className="text-right">
                <span className="font-extrabold text-slate-800">{totalTickets} tickets</span>
                <span className="text-green-600 font-bold ml-2">₹{totalAmount}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-600 bg-slate-100 active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-60"
              >
                {submitting ? "Saving..." : "Confirm ✓"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
