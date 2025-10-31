import { Router } from 'express';
import { enviarCorreoVisita } from '../utils/sendgridMail.js';

const router = Router();

router.get('/correo-prueba', async (req, res) => {
  const to = 'darienycarpio@gmail.com';
  const subject = 'Prueba desde Proyecto Área 3';
  const html = '<h2>¡Hola!</h2><p>Este es un correo de prueba usando SendGrid</p>';

  const result = await enviarCorreoVisita(to, subject, html);
  res.json(result);
});

export default router;
