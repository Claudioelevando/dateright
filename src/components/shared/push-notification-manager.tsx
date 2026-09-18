"use client";

import { useEffect } from "react";

import { requestPushToken } from "@/lib/firebase-client";
import { trpc } from "@/lib/trpc/client";

// Sem UI: pede permissão de notificação (se ainda não decidida) e registra o token FCM
// assim que há um perfil autenticado. Silencioso em qualquer falha — push é um extra,
// nunca deve travar a navegação nem expor erro ao usuário.
export function PushNotificationManager() {
  const registerToken = trpc.notification.registerToken.useMutation();

  useEffect(() => {
    requestPushToken()
      .then((token) => {
        if (token) registerToken.mutate({ token });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registerToken (mutation) não é estável entre renders; incluí-lo causaria novo registro a cada render.
  }, []);

  return null;
}
