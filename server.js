const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
require('./config/passport');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const testRoutes = require('./routes/testRoutes');

const app = express();
const path = require("path");

// ⬇️ Add this line BEFORE your route handlers
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ APPLY CORS AT THE VERY TOP
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: 'supersecretdevkey12345677',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/', testRoutes); // ✅ keep this AFTER /admin

app.get('/', (req, res) => {
  res.send('Server running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
