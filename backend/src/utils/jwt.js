import jwt from 'jsonwebtoken';

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  console.warn('JWT_SECRET no está definida en el backend de Vercel.');
}

export function signAccess(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '2h', ...options });
}

export function verifyAccess(token) {
  return jwt.verify(token, JWT_SECRET);
}
