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
    successRedirect: process.env.FRONTEND_URL + '/dashboard',
  })
);

router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(process.env.FRONTEND_URL);
  });
});

router.get('/current_user', (req, res) => {
  res.send(req.user || null);
});

module.exports = router;
