import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import api from "../services/api";
import toast from "react-hot-toast";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const FILTERS = [
  { value: "day", label: "Today" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom Range" },
];

export default function ReportsPage() {
  const [filter, setFilter] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { filter };
      if (filter === "custom") { params.from = from; params.to = to; }
      const res = await api.get("/reports", { params });
      setData(res.data);
    } catch {
      toast.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [filter]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({ filter });
      if (filter === "custom") { params.set("from", from); params.set("to", to); }
      const token = localStorage.getItem("token");
      const base = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${base}/reports/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `parking_report_${filter}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report exported!");
    } catch {
      toast.error("Export failed");
    }
  };

  const chartData = data?.daily || [];
  const barConfig = {
    labels: chartData.map((d) => new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })),
    datasets: [
      {
        label: "Revenue (₹)",
        data: chartData.map((d) => d.revenue),
        backgroundColor: "rgba(59,130,246,0.7)",
        borderRadius: 6,
      },
    ],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, grid: { color: "#f1f5f9" } }, x: { grid: { display: false } } },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Reports</h1>
          <p className="text-slate-400 text-sm mt-0.5">Ticket sales and revenue analytics</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 active:scale-95 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export CSV
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === f.value ? "bg-blue-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Custom range pickers */}
      {filter === "custom" && (
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <button onClick={fetchReports} className="px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors">Apply</button>
        </div>
      )}

      {/* Summary row */}
      {data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm">Total Tickets</p>
            <p className="text-3xl font-extrabold text-blue-600 mt-1">{data.totalTickets}</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-slate-500 text-sm">Total Revenue</p>
            <p className="text-3xl font-extrabold text-green-600 mt-1">₹{data.totalRevenue}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {data && chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4">Daily Revenue</h3>
          <div className="h-56">
            <Bar data={barConfig} options={barOptions} />
          </div>
        </div>
      )}

      {/* By Type */}
      {data?.byType?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-4">By Ticket Type</h3>
          <div className="space-y-3">
            {data.byType.map((t) => (
              <div key={t.name} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">{t.name}</span>
                    <span className="text-slate-500">{t.tickets} tickets · ₹{t.revenue}</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full mt-1.5">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, (t.revenue / (data.totalRevenue || 1)) * 100)}%`, backgroundColor: t.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entries table */}
      {data && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-700">Entry Log</h3>
          </div>
          {loading ? (
            <div className="p-10 flex justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : data.entries.length === 0 ? (
            <div className="p-10 text-center text-slate-400">No entries found for this period</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Date & Time</th>
                    <th className="px-6 py-3 text-left font-semibold">Ticket Type</th>
                    <th className="px-6 py-3 text-right font-semibold">Qty</th>
                    <th className="px-6 py-3 text-right font-semibold">Revenue</th>
                    <th className="px-6 py-3 text-left font-semibold">Serial Range</th>
                    <th className="px-6 py-3 text-left font-semibold">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.entries.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-3 text-slate-600 font-mono text-xs">
                        {new Date(e.createdAt).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: e.ticketType.color }} />
                          <span className="font-semibold text-slate-700">{e.ticketType.name}</span>
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-slate-800">{e.quantity}</td>
                      <td className="px-6 py-3 text-right font-bold text-green-600">₹{e.quantity * e.ticketType.value}</td>
                      <td className="px-6 py-3 font-mono text-xs text-slate-500">{e.startSerial}–{e.endSerial}</td>
                      <td className="px-6 py-3 text-slate-600">{e.user.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
