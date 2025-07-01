function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Unauthorized: Admins only' });
}

module.exports = ensureAdmin;
