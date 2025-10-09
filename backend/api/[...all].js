import app from '../src/app.js';

export default function handler(req, res) {
  console.log('serverless hit:', req.method, req.url);
  return app(req, res);
}
