const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const dotenv = require('dotenv');
const pgSession = require('connect-pg-simple')(session); // ✅ Add this
const pool = require('./db'); // ✅ Your DB pool

dotenv.config();
require('./config/passport');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const testRoutes = require('./routes/testRoutes');

const app = express();
const path = require("path");

// ✅ Serve static files (e.g., images or files from uploads/)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ CORS setup (IMPORTANT: must come before routes)
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

// ✅ Use PostgreSQL to store sessions
app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: 'session', // This will be auto-created if not present
    }),
    secret: 'supersecretdevkey12345677', // Ideally from .env
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,        // ✅ Vercel + Render are HTTPS, so use secure cookies
      httpOnly: true,
      sameSite: 'none',    // ✅ Required for cross-origin session sharing
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

// ✅ Passport setup
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', testRoutes);

// ✅ Default route
app.get('/', (req, res) => {
  res.send('Server running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
