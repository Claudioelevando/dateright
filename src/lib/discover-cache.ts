import { redis } from "@/lib/redis";

// Definido à mão (em vez de derivar de RouterOutputs) porque esse módulo é importado pelo
// próprio discoverRouter — inferir a partir do tipo do router criaria uma referência circular.
interface DiscoverCandidate {
  id: string;
  name: string;
  age: number;
  city: string;
  distanceKm: number | undefined;
  bio: string | undefined;
  photos: string[];
  interests: string[];
  compatibility: number;
}

type Candidates = DiscoverCandidate[];

// TTL curto: a lista de candidatos muda com ações de outros usuários (novos perfis,
// matches, bloqueios) e não precisa ficar perfeitamente em tempo real — só evita
// recalcular a query pesada (geo + questionário + URLs assinadas de foto) a cada
// reabertura da tela. Exclusão de quem já foi swipado é garantida à parte, via
// invalidação explícita em match.swipe (ver src/server/routers/match.ts).
const TTL_SECONDS = 60;

function cacheKey(userId: string) {
  return `discover:candidates:${userId}`;
}

export async function getCachedCandidates(userId: string, limit: number): Promise<Candidates | null> {
  const cached = await redis.get<{ limit: number; candidates: Candidates }>(cacheKey(userId));
  // Um limit diferente do que foi cacheado não é um subconjunto seguro de reaproveitar
  // (menos candidatos cacheados não cobre um limit maior) — trata como cache miss.
  return cached && cached.limit === limit ? cached.candidates : null;
}

export async function setCachedCandidates(userId: string, limit: number, candidates: Candidates) {
  await redis.set(cacheKey(userId), { limit, candidates }, { ex: TTL_SECONDS });
}

export async function invalidateDiscoverCache(userId: string) {
  await redis.del(cacheKey(userId));
}
