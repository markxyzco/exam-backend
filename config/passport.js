const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const pool = require('../db');

// ✅ Define admin email allowlist here
const allowedAdmins = ['pubgarjun19@gmail.com', 'adityabanka08@gmail.com'];

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  done(null, result.rows[0]);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const role = allowedAdmins.includes(email) ? 'admin' : 'student';

        const existingUser = await pool.query(
          'SELECT * FROM users WHERE google_id = $1',
          [profile.id]
        );

        if (existingUser.rows.length > 0) {
          // Update role if changed
          await pool.query(
            'UPDATE users SET role = $1 WHERE google_id = $2',
            [role, profile.id]
          );
          return done(null, { ...existingUser.rows[0], role });
        }

        const newUser = await pool.query(
          'INSERT INTO users (google_id, name, email, picture, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [profile.id, profile.displayName, email, profile.photos[0].value, role]
        );

        done(null, newUser.rows[0]);
      } catch (err) {
        done(err, null);
      }
    }
  )
);
