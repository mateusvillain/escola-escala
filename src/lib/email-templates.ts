export function passwordResetEmailHtml(resetLink: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Redefinir sua senha</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;max-width:560px;">
          <tr>
            <td>
              <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Redefinir sua senha</h2>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Recebemos uma solicitação para redefinir a senha da sua conta.
                Clique no botão abaixo para criar uma nova senha. O link expira em <strong>1 hora</strong>.
              </p>
              <a href="${resetLink}"
                 style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">
                Redefinir senha
              </a>
              <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
                Se você não solicitou a redefinição de senha, ignore este e-mail.
                Sua senha permanecerá a mesma.
              </p>
              <p style="margin:12px 0 0;color:#6b7280;font-size:12px;">
                Ou copie e cole este link no navegador:<br/>
                <a href="${resetLink}" style="color:#2563eb;word-break:break-all;">${resetLink}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function welcomeEmailHtml(name: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bem-vindo à plataforma!</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;padding:40px;max-width:560px;">
          <tr>
            <td>
              <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">Bem-vindo, ${name}!</h2>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Sua conta foi criada com sucesso. Agora você tem acesso a todos os cursos
                disponíveis no seu plano.
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard"
                 style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:600;">
                Acessar o dashboard
              </a>
              <p style="margin:24px 0 0;color:#6b7280;font-size:13px;line-height:1.6;">
                Se você tiver alguma dúvida, entre em contato com nosso suporte.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
