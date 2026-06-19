import nodemailer from "nodemailer";
import {
  passwordResetEmailHtml,
  welcomeEmailHtml,
  trialEndingEmailHtml,
  paymentFailedEmailHtml,
} from "./email-templates";

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;

  if (!smtpHost || smtpHost === "TODO_FILL_MANUALLY") {
    const testAccount = await nodemailer.createTestAccount();
    console.log("[email] Ethereal test account:", testAccount.user);
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: process.env.SMTP_FROM || "noreply@example.com",
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("[email] Preview URL:", previewUrl);
    }
  } catch (err) {
    console.error("[email] Falha ao enviar e-mail:", err);
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Plataforma de Cursos";
  await sendEmail({
    to: email,
    subject: `Redefinição de senha — ${appName}`,
    html: passwordResetEmailHtml(resetLink),
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  await sendEmail({
    to: email,
    subject: "Bem-vindo à plataforma!",
    html: welcomeEmailHtml(name),
  });
}

export async function sendTrialEndingEmail(
  email: string,
  name: string,
  trialEnd: Date,
  amount: number,
  billingCycle: "monthly" | "annual"
) {
  const formattedDate = trialEnd.toLocaleDateString("pt-BR");
  const cycleSuffix = billingCycle === "annual" ? "/ano" : "/mês";
  const formattedPrice = `${amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}${cycleSuffix}`;
  await sendEmail({
    to: email,
    subject: "Seu período de teste está acabando",
    html: trialEndingEmailHtml(name, formattedDate, formattedPrice),
  });
}

export async function sendPaymentFailedEmail(email: string, name: string, portalUrl: string) {
  await sendEmail({
    to: email,
    subject: "Não conseguimos processar seu pagamento",
    html: paymentFailedEmailHtml(name, portalUrl),
  });
}
