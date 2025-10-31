import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Enviar un correo con o sin adjuntos.
 * @param {string} to - Correo del destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} html - Contenido HTML del correo
 * @param {Array} attachments - Adjuntos opcionales (PDFs, etc.)
 */
export async function enviarCorreoVisita(to, subject, html, attachments = []) {
  try {
    const msg = {
      to,
      from: {
        name: process.env.SENDGRID_FROM_NAME,
        email: process.env.SENDGRID_FROM_EMAIL
      },
      subject,
      html,
      attachments
    };

    await sgMail.send(msg);
    console.log('Correo enviado a:', to);
    return { ok: true };
  } catch (err) {
    console.error('Error al enviar correo:', err);
    return { ok: false, error: err.message };
  }
}
