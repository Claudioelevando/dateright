import { getResend } from "@/lib/resend";

const BRAND_COLOR = "#c2255c";

// name vem do perfil do usuário (onboarding) — precisa escapar antes de interpolar no HTML
// do e-mail, senão um nome como "<img src=x onerror=...>" quebra o layout ou injeta phishing.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function emailShell(title: string, bodyHtml: string) {
  return `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;padding:0;background-color:#f7f5f4;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;">
                <p style="margin:0;font-size:20px;font-weight:700;color:${BRAND_COLOR};">DateRight</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;color:#1a1a1a;font-size:15px;line-height:1.6;">
                <h1 style="font-size:20px;margin:0 0 16px 0;color:#1a1a1a;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;padding:12px 24px;background-color:${BRAND_COLOR};color:#ffffff;text-decoration:none;border-radius:9999px;font-weight:600;font-size:14px;">${label}</a>`;
}

// Falha de e-mail nunca deve derrubar o fluxo principal (onboarding, match, etc.) —
// por isso cada função captura e só loga o erro.
async function sendSafely(params: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) return;

  try {
    await getResend().emails.send({ from: process.env.RESEND_FROM_EMAIL!, ...params });
  } catch (error) {
    console.error("Falha ao enviar e-mail via Resend:", error);
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const safeName = escapeHtml(name);
  await sendSafely({
    to,
    subject: `Bem-vindo(a) ao DateRight, ${name}!`,
    html: emailShell(
      `Bem-vindo(a), ${safeName}!`,
      `<p>Seu perfil no DateRight foi criado. Agora é hora de conhecer pessoas com quem você realmente combina — em valores, princípios e visão de mundo, não só localização.</p>
       ${ctaButton(`${appUrl}/discover`, "Começar a descobrir")}`,
    ),
  });
}
