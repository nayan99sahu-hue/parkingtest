import { useState, useEffect } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement, Filler,
} from "chart.js";
import api from "../services/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

const StatCard = ({ label, value, sub, color }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
    <p className="text-slate-500 text-sm font-medium">{label}</p>
    <p className="text-3xl font-extrabold mt-1" style={{ color }}>{value}</p>
    {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
  </div>
);

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/reports/dashboard")
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const chartData = data?.chartData || [];

  const lineConfig = {
    labels: chartData.map((d) => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    }),
    datasets: [
      {
        label: "Revenue (₹)",
        data: chartData.map((d) => d.revenue),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,0.08)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#3B82F6",
        pointRadius: 4,
      },
      {
        label: "Tickets",
        data: chartData.map((d) => d.tickets),
        borderColor: "#10B981",
        backgroundColor: "rgba(16,185,129,0.08)",
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#10B981",
        pointRadius: 4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: { y: { beginAtZero: true, grid: { color: "#f1f5f9" } }, x: { grid: { display: false } } },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Overview of today and this month</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Revenue" value={`₹${data?.today?.revenue || 0}`} sub="Today" color="#3B82F6" />
        <StatCard label="Today's Tickets" value={data?.today?.tickets || 0} sub="Sold today" color="#10B981" />
        <StatCard label="Month Revenue" value={`₹${data?.month?.revenue || 0}`} sub="This month" color="#8B5CF6" />
        <StatCard label="Month Tickets" value={data?.month?.tickets || 0} sub="This month" color="#F59E0B" />
      </div>

      {/* Info row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <p className="text-slate-500 text-sm">Total Users</p>
            <p className="text-2xl font-extrabold text-slate-800">{data?.totalUsers || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
          </div>
          <div>
            <p className="text-slate-500 text-sm">Active Ticket Types</p>
            <p className="text-2xl font-extrabold text-slate-800">{data?.activeTicketTypes || 0}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="font-bold text-slate-700 mb-4">Last 30 Days Activity</h2>
        {chartData.length > 0 ? (
          <div className="h-64">
            <Line data={lineConfig} options={lineOptions} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-400">
            <p>No data yet. Start logging entries!</p>
          </div>
        )}
      </div>
    </div>
  );
}
