require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cron = require("node-cron");
const { stringify } = require("csv-stringify/sync");

const Registration = require("./models/Registration");
const AdminUser = require("./models/AdminUser");
const { requireAuth, requireRole } = require("./middleware/auth");
const { sendMail, registrationEmailTemplate, reminderEmailTemplate } = require("./services/mailer");

const app = express();
const PORT = Number(process.env.PORT || 4000);
const ROOT_DIR = __dirname;
const CONTENT_FILE = path.join(ROOT_DIR, "data", "content.json");
const EVENT_START_AT = new Date(process.env.EVENT_START_AT || "2026-08-17T09:00:00+05:30");
const IS_VERCEL = Boolean(process.env.VERCEL);

let initPromise = null;
let adminSeeded = false;
let cronStarted = false;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("tiny"));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api", apiLimiter);

app.use(express.static(ROOT_DIR));

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function toTrackLabel(track) {
  const trackMap = {
    tech: "Tech & Innovation",
    cultural: "Cultural Performances",
    career: "Career & Startup",
    gaming: "Esports"
  };

  return trackMap[track] || track;
}

function generateToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function readContent() {
  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeContent(content) {
  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2));
}

async function ensureAdminSeed() {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return;
  }

  const existing = await AdminUser.findOne({ email: adminEmail });
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await AdminUser.create({
    name: process.env.ADMIN_NAME || "CampusFest Admin",
    email: adminEmail,
    passwordHash,
    role: "admin"
  });
}

async function connectToDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required in environment variables.");
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!initPromise) {
    initPromise = mongoose.connect(process.env.MONGODB_URI).finally(() => {
      initPromise = null;
    });
  }

  await initPromise;
}

async function initializeApp() {
  await connectToDatabase();

  if (!adminSeeded) {
    await ensureAdminSeed();
    adminSeeded = true;
  }

  if (!IS_VERCEL && !cronStarted) {
    cron.schedule("0 * * * *", async () => {
      await sendReminderMails();
    });

    cronStarted = true;
  }
}

async function sendReminderMails() {
  const now = new Date();
  const diffMs = EVENT_START_AT.getTime() - now.getTime();
  const hoursRemaining = diffMs / (1000 * 60 * 60);

  if (hoursRemaining > 24.5 || hoursRemaining < 23.5) {
    return;
  }

  const registrations = await Registration.find({ reminderSentAt: null });

  for (const registration of registrations) {
    try {
      await sendMail({
        to: registration.email,
        subject: "CampusFest Reminder - Event starts in 24 hours",
        html: reminderEmailTemplate(registration.name, EVENT_START_AT.toLocaleString())
      });

      registration.reminderSentAt = new Date();
      await registration.save();
    } catch (error) {
      // Continue sending reminders to other participants even if one send fails.
      console.error("Reminder send failed:", error.message);
    }
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "Server is healthy." });
});

app.use("/api", async (_req, res, next) => {
  const path = _req.path || "";
  const needsDatabase =
    path === "/register" || path === "/auth/login" || path.startsWith("/admin");

  if (!needsDatabase) {
    return next();
  }

  try {
    await initializeApp();
    next();
  } catch (error) {
    console.error("Initialization failed:", error.message);
    res.status(500).json({
      success: false,
      message: `Server initialization failed: ${error.message}`
    });
  }
});

app.get("/api/content", async (_req, res) => {
  const content = await readContent();
  res.json({ success: true, data: content });
});

app.put("/api/content", requireAuth, requireRole("admin", "editor"), async (req, res) => {
  const payload = req.body;

  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ success: false, message: "Invalid content payload." });
  }

  await writeContent(payload);
  return res.json({ success: true, message: "Content updated successfully." });
});

app.put(
  "/api/content/announcement",
  requireAuth,
  requireRole("admin", "editor"),
  async (req, res) => {
    const { enabled, message, type } = req.body;
    const content = await readContent();

    content.announcement = {
      enabled: Boolean(enabled),
      message: String(message || "").trim(),
      type: ["info", "warning", "success"].includes(type) ? type : "info"
    };

    await writeContent(content);
    return res.json({ success: true, message: "Announcement updated." });
  }
);

app.post("/api/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = normalizeEmail(req.body.email);
  const college = String(req.body.college || "").trim();
  const phone = normalizePhone(req.body.phone);
  const eventType = String(req.body.eventType || "").trim();
  const message = String(req.body.message || "").trim();
  const termsAccepted = Boolean(req.body.termsAccepted);

  if (!name || name.length < 3) {
    return res.status(400).json({ success: false, message: "Name must be at least 3 characters." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Enter a valid email address." });
  }

  if (!college || college.length < 2) {
    return res.status(400).json({ success: false, message: "College name is required." });
  }

  if (!/^\d{10}$/.test(phone)) {
    return res.status(400).json({ success: false, message: "Enter a valid 10-digit phone number." });
  }

  if (!["tech", "cultural", "career", "gaming"].includes(eventType)) {
    return res.status(400).json({ success: false, message: "Please select a valid track." });
  }

  if (!termsAccepted) {
    return res.status(400).json({ success: false, message: "You must accept terms and policy." });
  }

  const duplicate = await Registration.findOne({
    $or: [{ email }, { phone }]
  });

  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: "You have already registered with this email or phone number."
    });
  }

  const registration = await Registration.create({
    name,
    email,
    college,
    phone,
    eventType,
    message,
    termsAccepted
  });

  try {
    await sendMail({
      to: email,
      subject: "CampusFest Registration Confirmation",
      html: registrationEmailTemplate(name, toTrackLabel(eventType))
    });
  } catch (error) {
    console.error("Confirmation email failed:", error.message);
  }

  return res.status(201).json({
    success: true,
    message: "Registration successful.",
    data: { id: registration._id }
  });
});

app.post("/api/auth/login", async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  const user = await AdminUser.findOne({ email });
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  const token = generateToken(user);
  return res.json({
    success: true,
    message: "Login successful.",
    data: {
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
});

app.get("/api/admin/registrations", requireAuth, requireRole("admin", "editor"), async (req, res) => {
  const search = String(req.query.search || "").trim();
  const track = String(req.query.track || "").trim();

  const query = {};

  if (track && ["tech", "cultural", "career", "gaming"].includes(track)) {
    query.eventType = track;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { college: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } }
    ];
  }

  const registrations = await Registration.find(query).sort({ createdAt: -1 }).lean();

  return res.json({ success: true, data: registrations });
});

app.get("/api/admin/registrations.csv", requireAuth, requireRole("admin", "editor"), async (_req, res) => {
  const registrations = await Registration.find().sort({ createdAt: -1 }).lean();

  const csv = stringify(registrations, {
    header: true,
    columns: [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "college", header: "College" },
      { key: "phone", header: "Phone" },
      { key: "eventType", header: "Track" },
      { key: "message", header: "Message" },
      { key: "createdAt", header: "Registered At" },
      { key: "reminderSentAt", header: "Reminder Sent At" }
    ]
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=registrations.csv");
  res.send(csv);
});

app.get("/api/admin/stats", requireAuth, requireRole("admin", "editor"), async (_req, res) => {
  const total = await Registration.countDocuments();

  const grouped = await Registration.aggregate([
    {
      $group: {
        _id: "$eventType",
        count: { $sum: 1 }
      }
    }
  ]);

  return res.json({ success: true, data: { total, tracks: grouped } });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "admin.html"));
});

app.get("/privacy", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "privacy.html"));
});

app.get("/terms", (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, "terms.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const message = String(err?.message || "");

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate registration found. Use another email or phone number."
    });
  }

  if (
    /not authorized|authentication failed|buffering timed out|server selection timed out|econnrefused|enotfound|network/i.test(
      message
    )
  ) {
    return res.status(503).json({
      success: false,
      message:
        "Database operation failed. Verify Vercel MONGODB_URI and MongoDB Atlas network access (allow 0.0.0.0/0)."
    });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again shortly."
  });
});

if (!IS_VERCEL) {
  initializeApp()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`CampusFest server running on http://localhost:${PORT}`);
      });
    })
    .catch((error) => {
      console.error("Failed to start server:", error.message);
    });
}

module.exports = app;
