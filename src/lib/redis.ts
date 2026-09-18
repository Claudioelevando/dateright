import { Redis } from "@upstash/redis";

// Nomes de env var vêm do provisionamento via Vercel Marketplace (Upstash for
// Redis), não do padrão UPSTASH_REDIS_REST_* que o SDK espera por default.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});
