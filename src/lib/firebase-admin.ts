import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging as getFirebaseMessaging } from "firebase-admin/messaging";

function createFirebaseAdminApp() {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);
  return initializeApp({ credential: cert(serviceAccount) });
}

// Inicialização preguiçosa: se importássemos e criássemos o app no top-level do módulo,
// qualquer rota que importe este arquivo quebraria assim que carregada, mesmo sem
// FIREBASE_SERVICE_ACCOUNT_JSON configurado — o chamador (src/lib/notifications/push.ts)
// já checa a env var antes de chamar isto.
export function getMessaging() {
  const app = getApps()[0] ?? createFirebaseAdminApp();
  return getFirebaseMessaging(app);
}
