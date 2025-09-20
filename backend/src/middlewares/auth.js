import { verifyAccess } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.accessToken;
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    const payload = verifyAccess(token);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requireRole(roles = []) {
  return (req, res, next) => {
    if (!roles.length) return next();
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (!roles.includes(req.user.rol)) return res.status(403).json({ error: 'Prohibido' });
    next();
  };
}
