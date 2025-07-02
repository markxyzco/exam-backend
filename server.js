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
app.set('trust proxy', 1); // ✅ Trust proxy for secure cookies

// ✅ Use PostgreSQL to store sessions
app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true, // ✅ NEW LINE
    }),
    secret: 'supersecretdevkey12345677',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
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
