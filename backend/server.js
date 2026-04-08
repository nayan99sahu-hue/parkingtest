require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const ticketTypeRoutes = require("./routes/ticketTypes");
const entryRoutes = require("./routes/entries");
const reportRoutes = require("./routes/reports");
const userRoutes = require("./routes/users");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/ticket-types", ticketTypeRoutes);
app.use("/api/entries", entryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Parking POS API running" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
