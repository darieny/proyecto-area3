import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // false para STARTTLS (Outlook)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { ciphers: "TLSv1.2" }, // Outlook necesita TLS moderno
});

export async function sendMail({ to, subject, html, text }) {
  const mailOptions = {
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email enviado a ${to}`);
  } catch (error) {
    console.error("Error enviando correo:", error.message);
    throw new Error("Error al enviar el correo");
  }
}
