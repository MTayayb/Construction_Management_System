const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");


dotenv.config({ path: path.join(__dirname, ".env") });
// Silence duplicate console logs if any (custom check)
if (process.env.SILENT_DOTENV === 'true') {
  // optional logic
}

const connectDB = require("./config/db");



const app = express();

// Serve the uploads folder as static
app.use("/api/uploads", express.static("uploads"))


// Middleware
app.use(cors());
app.use(express.json());

// Serve Frontend as static files
app.use(express.static(path.join(__dirname, "../Frontend")));


// Routes
const authRoutes = require("./routes/auth.routes");

app.use("/api/auth", authRoutes);

const projectRoutes = require("./routes/project.routes");
const taskRoutes = require("./routes/task.routes");
const materialRoutes = require("./routes/material.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const salaryRoutes = require("./routes/salary.routes");
const changeRequestRoutes = require("./routes/changeRequest.routes");
const notificationRoutes = require("./routes/notification.routes");
const analyticsRoutes = require("./routes/analytics.routes");


app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/salary", salaryRoutes);
app.use("/api/change-requests", changeRequestRoutes);
app.use("/api/reports", require("./routes/report.routes"));
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);


// Static folder for 3D uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect Database
connectDB();

// Test Route
// app.get("/", (req, res) => {
//   res.send("CMS Backend is running");
// });

// Serve Frontend index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});


// Start Server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
