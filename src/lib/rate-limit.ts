import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "./redis";

// Limites das rotas de autenticação — protegem contra brute-force de senha,
// spam de cadastro e email-bombing via recuperação de senha. Duas camadas por
// ação sensível: um limite mais largo por IP (evita um único endereço esgotar
// tentativas contra várias contas) e um mais estrito por e-mail (evita que
// tentativas distribuídas por vários IPs continuem atacando a mesma conta).
export const loginRateLimitByIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "5 m"),
  prefix: "ratelimit:login:ip",
});

export const loginRateLimitByEmail = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  prefix: "ratelimit:login:email",
});

export const signupRateLimitByIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 m"),
  prefix: "ratelimit:signup:ip",
});

export const passwordResetRateLimitByIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 m"),
  prefix: "ratelimit:password-reset:ip",
});

export const passwordResetRateLimitByEmail = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "60 m"),
  prefix: "ratelimit:password-reset:email",
});
