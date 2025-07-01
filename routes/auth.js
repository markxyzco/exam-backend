const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
}));

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/',
    successRedirect: 'http://localhost:5173/dashboard',
  })
);

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('http://localhost:5173');
  });
});

router.get('/current_user', (req, res) => {
  res.send(req.user || null);
});

module.exports = router;
