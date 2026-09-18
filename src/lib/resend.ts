import { Resend } from "resend";

const globalForResend = globalThis as unknown as { resend?: Resend };

// Inicialização preguiçosa: o construtor do Resend lança se a API key estiver ausente, e
// importar este módulo não deve quebrar rotas que nunca chegam a enviar e-mail (o chamador,
// src/lib/notifications/email.ts, já checa a env var antes de chamar isto).
export function getResend() {
  if (!globalForResend.resend) {
    globalForResend.resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return globalForResend.resend;
}
