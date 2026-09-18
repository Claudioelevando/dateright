import { prisma } from "@/lib/db";
import { getMessaging } from "@/lib/firebase-admin";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

const STALE_TOKEN_ERROR_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

// Falha de push nunca deve derrubar o fluxo principal (swipe, mensagem, etc.) — por isso
// nunca propaga erro, e limpa tokens inválidos (app desinstalado, permissão revogada) para
// não seguir tentando enviar pra eles indefinidamente.
export async function sendPushToProfile(profileId: string, payload: PushPayload) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return;

  const tokens = await prisma.pushToken.findMany({
    where: { profileId },
    select: { token: true },
  });
  if (tokens.length === 0) return;

  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens: tokens.map((t) => t.token),
      notification: { title: payload.title, body: payload.body },
      webpush: {
        fcmOptions: payload.url ? { link: payload.url } : undefined,
        notification: { icon: "/icon.png" },
      },
    });

    const staleTokens = response.responses
      .map((result, index) =>
        !result.success && STALE_TOKEN_ERROR_CODES.has(result.error?.code ?? "")
          ? tokens[index].token
          : null,
      )
      .filter((token): token is string => token !== null);

    if (staleTokens.length > 0) {
      await prisma.pushToken.deleteMany({ where: { token: { in: staleTokens } } });
    }
  } catch (error) {
    console.error("Falha ao enviar push notification:", error);
  }
}
