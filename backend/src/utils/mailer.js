import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-mail.outlook.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: String(process.env.SMTP_SECURE || "false") === "true", // false => STARTTLS
  requireTLS: true,               
  authMethod: "LOGIN",            
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, 
  },
  tls: {
    ciphers: "TLSv1.2",
  },
  connectionTimeout: 20_000,
  greetingTimeout: 20_000,
  socketTimeout: 30_000,
  logger: true, // para ver el handshake en logs
  debug: true,
});

export async function sendMail({ to, subject, html, text }) {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email enviado a ${to}`);
  } catch (error) {
    console.error("Error enviando correo (SMTP):", error && error.message);
    throw new Error("Error al enviar el correo");
  }
}

// (Opcional) Verifica al arrancar:
export async function verifyMailer() {
  try {
    await transporter.verify();
    console.log("SMTP listo ");
  } catch (e) {
    console.error("SMTP no disponible :", e && e.message);
  }
}

