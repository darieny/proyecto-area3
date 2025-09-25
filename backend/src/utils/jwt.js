import jwt from 'jsonwebtoken';

const {
  JWT_SECRET,            
  JWT_ACCESS_SECRET,     
  JWT_REFRESH_SECRET,    
  ACCESS_TOKEN_TTL = '2h',
  REFRESH_TOKEN_TTL = '7d',
} = process.env;


const ACCESS_SECRET = JWT_ACCESS_SECRET || JWT_SECRET;

if (!ACCESS_SECRET) {
  console.warn(
    '⚠️ No hay ACCESS_SECRET (define JWT_ACCESS_SECRET o JWT_SECRET en Vercel).'
  );
}

export function signAccess(payload, options = {}) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TOKEN_TTL, ...options });
}

export function verifyAccess(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

// Soporte para refresh (lo puedes usar más adelante)
export function signRefresh(payload, options = {}) {
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET no está definida');
  }
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL, ...options });
}

export function verifyRefresh(token) {
  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET no está definida');
  }
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

