const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Build date filter from query params
const buildDateFilter = (filter, from, to) => {
  const now = new Date();
  if (filter === "day") {
    const start = new Date(now); start.setHours(0,0,0,0);
    const end = new Date(now); end.setHours(23,59,59,999);
    return { gte: start, lte: end };
  }
  if (filter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { gte: start, lte: end };
  }
  if (filter === "year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { gte: start, lte: end };
  }
  if (filter === "custom" && from && to) {
    return { gte: new Date(from), lte: new Date(to + "T23:59:59.999Z") };
  }
  return undefined;
};

const getReports = async (req, res) => {
  try {
    const { filter = "month", from, to } = req.query;
    const dateFilter = buildDateFilter(filter, from, to);

    const entries = await prisma.ticketEntry.findMany({
      where: dateFilter ? { createdAt: dateFilter } : {},
      include: {
        ticketType: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Summary stats
    const totalTickets = entries.reduce((s, e) => s + e.quantity, 0);
    const totalRevenue = entries.reduce((s, e) => s + e.quantity * e.ticketType.value, 0);

    // Group by date for chart
    const dailyMap = {};
    entries.forEach((e) => {
      const day = e.createdAt.toISOString().split("T")[0];
      if (!dailyMap[day]) dailyMap[day] = { tickets: 0, revenue: 0 };
      dailyMap[day].tickets += e.quantity;
      dailyMap[day].revenue += e.quantity * e.ticketType.value;
    });
    const daily = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Group by ticket type
    const byType = {};
    entries.forEach((e) => {
      const key = e.ticketType.name;
      if (!byType[key]) byType[key] = { name: key, tickets: 0, revenue: 0, color: e.ticketType.color };
      byType[key].tickets += e.quantity;
      byType[key].revenue += e.quantity * e.ticketType.value;
    });

    res.json({
      entries,
      totalTickets,
      totalRevenue,
      daily,
      byType: Object.values(byType),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

// Export as CSV (we generate CSV manually – no extra dependency needed)
const exportReport = async (req, res) => {
  try {
    const { filter = "month", from, to } = req.query;
    const dateFilter = buildDateFilter(filter, from, to);

    const entries = await prisma.ticketEntry.findMany({
      where: dateFilter ? { createdAt: dateFilter } : {},
      include: {
        ticketType: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Build CSV
    const header = "Date,Time,Ticket Type,Value (₹),Quantity,Revenue (₹),Start Serial,End Serial,Operator";
    const rows = entries.map((e) => {
      const dt = new Date(e.createdAt);
      const date = dt.toLocaleDateString("en-IN");
      const time = dt.toLocaleTimeString("en-IN");
      const revenue = e.quantity * e.ticketType.value;
      return `"${date}","${time}","${e.ticketType.name}",${e.ticketType.value},${e.quantity},${revenue},${e.startSerial},${e.endSerial},"${e.user.name}"`;
    });

    const csv = [header, ...rows].join("\n");
    const filename = `parking_report_${filter}_${Date.now()}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Export failed" });
  }
};

// Dashboard summary stats
const getDashboard = async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayEntries, monthEntries, totalUsers, ticketTypes] = await Promise.all([
      prisma.ticketEntry.findMany({
        where: { createdAt: { gte: today } },
        include: { ticketType: true },
      }),
      prisma.ticketEntry.findMany({
        where: { createdAt: { gte: monthStart } },
        include: { ticketType: true },
      }),
      prisma.user.count(),
      prisma.ticketType.count({ where: { isActive: true } }),
    ]);

    const sum = (arr) => ({
      tickets: arr.reduce((s, e) => s + e.quantity, 0),
      revenue: arr.reduce((s, e) => s + e.quantity * e.ticketType.value, 0),
    });

    // Last 30 days chart data
    const last30 = new Date(); last30.setDate(last30.getDate() - 29); last30.setHours(0,0,0,0);
    const recentEntries = await prisma.ticketEntry.findMany({
      where: { createdAt: { gte: last30 } },
      include: { ticketType: true },
      orderBy: { createdAt: "asc" },
    });

    const chartMap = {};
    recentEntries.forEach((e) => {
      const day = e.createdAt.toISOString().split("T")[0];
      if (!chartMap[day]) chartMap[day] = { date: day, tickets: 0, revenue: 0 };
      chartMap[day].tickets += e.quantity;
      chartMap[day].revenue += e.quantity * e.ticketType.value;
    });
    const chartData = Object.values(chartMap).sort((a,b) => a.date.localeCompare(b.date));

    res.json({
      today: sum(todayEntries),
      month: sum(monthEntries),
      totalUsers,
      activeTicketTypes: ticketTypes,
      chartData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Dashboard failed" });
  }
};

module.exports = { getReports, exportReport, getDashboard };
